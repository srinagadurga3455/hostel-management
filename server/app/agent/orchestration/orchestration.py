from app.agent.orchestration.planner import plan
from app.agent.orchestration.executor import execute
from app.agent.orchestration.verifier import verify
from app.agent.state.agent_session import get_session, save_session
from app.agent.policies.confirmation import requires_confirmation, is_confirmation_message, is_rejection_message
from app.agent.policies.safety import check_safety
from app.agent.types.tool_types import ToolContext
from app.core.llm import chat_completion
from app.agent.prompts.agent_prompt import RESPONSE_SYSTEM_PROMPT

async def orchestrate(message: str, session_id: str | None, user_id: str, role: str, token: str | None):
    # Safety
    ok, safety_msg = check_safety(message, None, role)
    if not ok:
        return {"success": False, "message": safety_msg, "session_id": session_id or "", "tool_used": None, "requires_confirmation": False}

    session = get_session(session_id, user_id, role)

    # Handle pending confirmation
    if session.pending_confirmation:
        if is_confirmation_message(message):
            pending = session.pending_confirmation
            session.pending_confirmation = None
            # execute pending
            ctx = ToolContext(user_id=str(user_id), role=role, token=token, session_id=session.session_id)
            try:
                result = await execute(pending["tool_name"], pending["arguments"], ctx)
                verified, err = verify(pending["tool_name"], result)
                if not verified:
                    save_session(session)
                    return {"success": False, "message": f"I couldn't complete the action: {err}", "session_id": session.session_id, "tool_used": pending["tool_name"], "requires_confirmation": False}
                # Generate natural response via LLM
                nl = await _natural_response(pending["tool_name"], result, message, session.messages)
                session.messages.extend([{"role": "user", "content": message}, {"role": "assistant", "content": nl}])
                session.last_tool = pending["tool_name"]
                session.last_tool_result = result
                save_session(session)
                return {"success": True, "message": nl, "session_id": session.session_id, "tool_used": pending["tool_name"], "requires_confirmation": False, "data": result.get("data")}
            except Exception as e:
                save_session(session)
                msg = str(e)
                if "not allowed" in msg.lower() or "permission" in msg.lower():
                    return {"success": False, "message": "You don't have permission to perform this action.", "session_id": session.session_id, "tool_used": pending["tool_name"], "requires_confirmation": False}
                return {"success": False, "message": f"Failed to execute: {msg}", "session_id": session.session_id, "tool_used": pending["tool_name"], "requires_confirmation": False}
        elif is_rejection_message(message):
            session.pending_confirmation = None
            save_session(session)
            return {"success": True, "message": "Okay, cancelled.", "session_id": session.session_id, "tool_used": None, "requires_confirmation": False}
        # else continue to new planning (user changed mind)

    # Normal planning
    agent_plan = await plan(message, role, session.messages)

    if agent_plan.is_greeting or agent_plan.intent == "GREETING":
        nl = await _greeting_response(message, session.messages)
        session.messages.extend([{"role": "user", "content": message}, {"role": "assistant", "content": nl}])
        save_session(session)
        return {"success": True, "message": nl, "session_id": session.session_id, "tool_used": None, "requires_confirmation": False}

    if agent_plan.intent == "UNKNOWN" or not agent_plan.tool_name:
        # Fallback to general chat
        nl = await _general_chat(message, session.messages)
        session.messages.extend([{"role": "user", "content": message}, {"role": "assistant", "content": nl}])
        save_session(session)
        return {"success": True, "message": nl, "session_id": session.session_id, "tool_used": None, "requires_confirmation": False}

    # Safety second check with tool
    ok2, safety_msg2 = check_safety(message, agent_plan.tool_name, role)
    if not ok2:
        return {"success": False, "message": safety_msg2, "session_id": session.session_id, "tool_used": None, "requires_confirmation": False}

    # Confirmation handling
    if agent_plan.requires_confirmation or requires_confirmation(agent_plan.tool_name):
        # Validate before asking confirmation
        from app.agent.policies.validation import validate
        from app.agent.errors.agent_errors import ValidationError
        try:
            validate(agent_plan.tool_name, agent_plan.arguments)
        except ValidationError as ve:
            # Save history so follow-up "on 1-09-2026" can be linked via planner's history check
            session.messages.extend([{"role": "user", "content": message}, {"role": "assistant", "content": f"{str(ve)} Please provide missing details."}])
            save_session(session)
            return {"success": False, "message": f"{str(ve)} Please provide missing details.", "session_id": session.session_id, "tool_used": agent_plan.tool_name, "requires_confirmation": False}
        session.pending_confirmation = {"tool_name": agent_plan.tool_name, "arguments": agent_plan.arguments, "intent": agent_plan.intent}
        save_session(session)
        # Human-friendly confirmation message (avoid code-like k: v)
        if agent_plan.tool_name == "create_complaint":
            title = agent_plan.arguments.get("title", "")
            desc = agent_plan.arguments.get("description", "")
            confirm_msg = f'You want to create a complaint — Title: "{title}" — Description: "{desc}". Should I submit it? Please reply Yes to confirm or No to cancel.'
        elif agent_plan.tool_name == "create_outing_request":
            args = agent_plan.arguments
            confirm_msg = f'You want to request an outing to {args.get("destination","")} on {args.get("outingDate","")} ({args.get("outTime","")} to {args.get("inTime","")}) for "{args.get("reason","")}". Should I submit it? Please reply Yes to confirm or No to cancel.'
        elif agent_plan.tool_name == "apply_leave":
            args = agent_plan.arguments
            confirm_msg = f'You want to apply for leave from {args.get("startDate","")} to {args.get("endDate","")} for "{args.get("reason","")}". Should I submit it? Please reply Yes to confirm or No to cancel.'
        else:
            args_str = ", ".join([f'{k} "{v}"' for k, v in agent_plan.arguments.items()]) if agent_plan.arguments else "with provided details"
            confirm_msg = f"You are requesting {agent_plan.intent.lower().replace('_',' ')} ({args_str}). Should I submit it? Please reply Yes to confirm or No to cancel."
        return {"success": True, "message": confirm_msg, "session_id": session.session_id, "tool_used": agent_plan.tool_name, "requires_confirmation": True}

    # Execute directly
    ctx = ToolContext(user_id=str(user_id), role=role, token=token, session_id=session.session_id)
    try:
        result = await execute(agent_plan.tool_name, agent_plan.arguments, ctx)
        verified, err = verify(agent_plan.tool_name, result)
        if not verified:
            return {"success": False, "message": f"I couldn't complete the request: {err}", "session_id": session.session_id, "tool_used": agent_plan.tool_name, "requires_confirmation": False}
        nl = await _natural_response(agent_plan.tool_name, result, message, session.messages)
        session.messages.extend([{"role": "user", "content": message}, {"role": "assistant", "content": nl}])
        session.last_tool = agent_plan.tool_name
        session.last_tool_result = result
        save_session(session)
        return {"success": True, "message": nl, "session_id": session.session_id, "tool_used": agent_plan.tool_name, "requires_confirmation": False, "data": result.get("data")}
    except Exception as e:
        msg = str(e)
        if "permission" in msg.lower() or "not allowed" in msg.lower():
            return {"success": False, "message": "You don't have permission to perform this action.", "session_id": session.session_id, "tool_used": agent_plan.tool_name, "requires_confirmation": False}
        if "validation" in msg.lower():
            return {"success": False, "message": msg, "session_id": session.session_id, "tool_used": agent_plan.tool_name, "requires_confirmation": False}
        return {"success": False, "message": f"Failed to execute {agent_plan.tool_name}: {msg}", "session_id": session.session_id, "tool_used": agent_plan.tool_name, "requires_confirmation": False}

async def _greeting_response(message: str, history: list) -> str:
    try:
        msgs = [{"role": "system", "content": "You are a friendly hostel assistant. Respond warmly and briefly to greetings."}, {"role": "user", "content": message}]
        return await chat_completion(msgs, temperature=0.7, max_tokens=100)
    except Exception:
        return "Hi! 👋 How can I help you with your hostel?"

async def _general_chat(message: str, history: list) -> str:
    try:
        msgs = [{"role": "system", "content": RESPONSE_SYSTEM_PROMPT}] + history[-4:] + [{"role": "user", "content": message}]
        return await chat_completion(msgs, temperature=0.7, max_tokens=300)
    except Exception:
        return "I'm here to help with hostel matters like attendance, leave, outings, complaints, and room info. How can I assist?"

async def _natural_response(tool_name: str, result: dict, user_message: str, history: list) -> str:
    try:
        data_str = str(result.get("data"))[:2000]
        msgs = [
            {"role": "system", "content": RESPONSE_SYSTEM_PROMPT},
            {"role": "user", "content": f"User asked: {user_message}\nTool {tool_name} returned: {data_str}\nGenerate a natural helpful response. Do not invent data."},
        ]
        return await chat_completion(msgs, temperature=0.7, max_tokens=300)
    except Exception:
        # Fallback simple formatting
        data = result.get("data")
        if tool_name == "get_attendance" and data:
            recs = data.get("records", [])
            return f"Your attendance records: {len(recs)} found. Details: {recs[:3]}"
        if tool_name == "create_complaint" and data:
            return f"Complaint created successfully with ID {data.get('id')}."
        if tool_name == "create_outing_request" and data:
            return f"Outing request created successfully with ID {data.get('id')} and status {data.get('status')}."
        return f"Operation {tool_name} completed successfully."

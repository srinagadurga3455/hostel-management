from app.agent.tools.registry import get
from app.agent.errors.agent_errors import ToolNotFoundError, ToolExecutionError
from app.agent.types.tool_types import ToolContext
from app.agent.policies.permission import check_permission
from app.agent.policies.validation import validate

async def execute(tool_name: str, arguments: dict, context: ToolContext):
    # permission
    check_permission(tool_name, context.role)
    # validation
    validate(tool_name, arguments)
    entry = get(tool_name)
    if not entry:
        raise ToolNotFoundError(f"Tool {tool_name} not found")
    func = entry["func"]
    try:
        result = await func(arguments, context)
        # result expected dict with success
        if isinstance(result, dict) and "success" in result:
            if not result["success"]:
                # tool signaled failure
                raise ToolExecutionError(result.get("error") or "Tool failed", status_code=result.get("status_code"))
            return result
        return {"success": True, "data": result}
    except ToolExecutionError:
        raise
    except Exception as e:
        # If already HTTPException-like
        if hasattr(e, "status_code"):
            raise ToolExecutionError(str(e), status_code=getattr(e, "status_code", None))
        raise ToolExecutionError(str(e))

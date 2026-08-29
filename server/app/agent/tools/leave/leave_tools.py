from app.core.http_client import HostelHttpClient
from app.agent.tools.registry import register
from app.agent.types.tool_types import ToolContext

async def apply_leave(args: dict, ctx: ToolContext):
    payload = {
        "startDate": args.get("start_date") or args.get("startDate"),
        "endDate": args.get("end_date") or args.get("endDate"),
        "reason": args.get("reason"),
    }
    client = HostelHttpClient(token=ctx.token)
    res = await client.post("/api/v1/leaves", json=payload)
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

async def get_my_leaves(args: dict, ctx: ToolContext):
    client = HostelHttpClient(token=ctx.token)
    res = await client.get("/api/v1/leaves")
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

async def get_leave_status(args: dict, ctx: ToolContext):
    lid = args.get("leave_id") or args.get("leaveId") or args.get("id")
    if lid:
        client = HostelHttpClient(token=ctx.token)
        res = await client.get(f"/api/v1/leaves/{lid}")
        if not res.is_success:
            return {"success": False, "error": res.text, "status_code": res.status_code}
        return {"success": True, "data": res.json()}
    return await get_my_leaves(args, ctx)

async def cancel_leave(args: dict, ctx: ToolContext):
    lid = args.get("leave_id") or args.get("leaveId") or args.get("id")
    if not lid:
        return {"success": False, "error": "leave_id required", "status_code": 400}
    client = HostelHttpClient(token=ctx.token)
    res = await client.patch(f"/api/v1/leaves/{lid}/cancel")
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

register("apply_leave", "Apply for leave", apply_leave, requires_confirmation=True)
register("get_leave_status", "Get leave status", get_leave_status)
register("get_my_leaves", "Get my leaves", get_my_leaves)
register("cancel_leave", "Cancel leave", cancel_leave, requires_confirmation=True)
register("get_leaves", "Get leaves", get_my_leaves)

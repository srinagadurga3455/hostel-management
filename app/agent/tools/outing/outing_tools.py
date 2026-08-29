from app.core.http_client import HostelHttpClient
from app.agent.tools.registry import register
from app.agent.types.tool_types import ToolContext

async def create_outing_request(args: dict, ctx: ToolContext):
    client = HostelHttpClient(token=ctx.token)
    payload = {
        "destination": args.get("destination"),
        "reason": args.get("reason"),
        "outingDate": args.get("outingDate") or args.get("outing_date"),
        "outTime": args.get("outTime") or args.get("out_time"),
        "inTime": args.get("inTime") or args.get("in_time"),
    }
    res = await client.post("/api/v1/outings", json=payload)
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

async def get_my_outings(args: dict, ctx: ToolContext):
    client = HostelHttpClient(token=ctx.token)
    res = await client.get("/api/v1/outings")
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

async def get_outing_status(args: dict, ctx: ToolContext):
    oid = args.get("outing_id") or args.get("outingId") or args.get("id")
    if oid:
        client = HostelHttpClient(token=ctx.token)
        res = await client.get(f"/api/v1/outings/{oid}")
        if not res.is_success:
            return {"success": False, "error": res.text, "status_code": res.status_code}
        return {"success": True, "data": res.json()}
    return await get_my_outings(args, ctx)

async def cancel_outing_request(args: dict, ctx: ToolContext):
    return {"success": False, "error": "Cancel outing not implemented in backend (only approve/reject by warden)", "status_code": 501}

async def approve_outing(args: dict, ctx: ToolContext):
    oid = args.get("outing_id") or args.get("outingId") or args.get("id") or args.get("outing_id")
    if not oid:
        return {"success": False, "error": "outing_id required", "status_code": 400}
    client = HostelHttpClient(token=ctx.token)
    res = await client.patch(f"/api/v1/outings/{oid}/approve")
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

async def reject_outing(args: dict, ctx: ToolContext):
    oid = args.get("outing_id") or args.get("outingId") or args.get("id")
    if not oid:
        return {"success": False, "error": "outing_id required", "status_code": 400}
    client = HostelHttpClient(token=ctx.token)
    res = await client.patch(f"/api/v1/outings/{oid}/reject")
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

register("create_outing_request", "Create outing request", create_outing_request, requires_confirmation=True)
register("create_outing", "Create outing request", create_outing_request, requires_confirmation=True)
register("get_my_outings", "Get my outings", get_my_outings)
register("get_outings", "Get my outings", get_my_outings)
register("get_outing_status", "Get outing status", get_outing_status)
register("cancel_outing_request", "Cancel outing request", cancel_outing_request, requires_confirmation=True)
register("cancel_outing", "Cancel outing request", cancel_outing_request, requires_confirmation=True)
register("approve_outing", "Approve outing request (warden)", approve_outing)
register("reject_outing", "Reject outing request (warden)", reject_outing)

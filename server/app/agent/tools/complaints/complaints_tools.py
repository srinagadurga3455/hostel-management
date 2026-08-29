from app.core.http_client import HostelHttpClient
from app.agent.tools.registry import register
from app.agent.types.tool_types import ToolContext

async def create_complaint(args: dict, ctx: ToolContext):
    client = HostelHttpClient(token=ctx.token)
    res = await client.post("/api/v1/complaints", json={"title": args.get("title"), "description": args.get("description")})
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

async def get_my_complaints(args: dict, ctx: ToolContext):
    # Student sees via warden endpoint? For now warden sees all, student has no direct my endpoint -> use complaints list as warden or fallback
    # Our backend currently only allows warden to list; for student we return not implemented via same endpoint with student token will 403 -> handle
    client = HostelHttpClient(token=ctx.token)
    res = await client.get("/api/v1/complaints")
    if not res.is_success:
        # If 403 for student, try to explain
        if res.status_code == 403:
            return {"success": False, "error": "Complaint listing is warden-only in current backend", "status_code": 403}
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

async def get_complaint_by_id(args: dict, ctx: ToolContext):
    cid = args.get("complaint_id") or args.get("complaintId") or args.get("id")
    client = HostelHttpClient(token=ctx.token)
    res = await client.get(f"/api/v1/complaints/{cid}")
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

async def get_complaint_status(args: dict, ctx: ToolContext):
    return await get_complaint_by_id(args, ctx)

register("create_complaint", "Create a complaint", create_complaint, requires_confirmation=True)
register("get_my_complaints", "Get my complaints", get_my_complaints)
register("get_complaints", "Get my complaints", get_my_complaints)
register("get_complaint_by_id", "Get complaint by id", get_complaint_by_id)
register("get_complaint_status", "Get complaint status", get_complaint_status)

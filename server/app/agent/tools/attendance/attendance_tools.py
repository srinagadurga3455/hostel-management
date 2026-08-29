from app.core.http_client import HostelHttpClient
from app.agent.tools.registry import register
from app.agent.types.tool_types import ToolContext

async def _resolve_student_id(ctx: ToolContext) -> int | None:
    client = HostelHttpClient(token=ctx.token)
    res = await client.get("/api/v1/users/me")
    if not res.is_success:
        return None
    data = res.json()
    stu = data.get("student")
    if stu and stu.get("id"):
        return stu["id"]
    # fallback: list students as warden and match userId
    if ctx.role.upper() in ("WARDEN", "ADMIN"):
        # For warden checking own attendance, student may be None -> return None
        return None
    return None

async def get_attendance(args: dict, ctx: ToolContext):
    client = HostelHttpClient(token=ctx.token)
    sid = args.get("studentId") or args.get("student_id")
    if not sid:
        sid = await _resolve_student_id(ctx)
        if not sid:
            # If warden without sid, try list
            if ctx.role.upper() in ("WARDEN","ADMIN"):
                return {"success": False, "error": "studentId required for warden", "status_code": 400}
            return {"success": False, "error": "Student profile not found", "status_code": 404}
    res = await client.get(f"/api/v1/attendance/student/{sid}")
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": {"student_id": sid, "records": res.json()}}

async def get_attendance_history(args: dict, ctx: ToolContext):
    return await get_attendance(args, ctx)

async def get_attendance_by_date(args: dict, ctx: ToolContext):
    # Filter by date client-side
    res = await get_attendance(args, ctx)
    if not res["success"]:
        return res
    target_date = args.get("date")
    if target_date:
        records = [r for r in res["data"]["records"] if r.get("date") == target_date]
        res["data"]["records"] = records
        res["data"]["date"] = target_date
    return res

register("get_attendance", "Get own attendance", get_attendance)
register("get_attendance_history", "Get attendance history", get_attendance_history)
register("get_attendance_by_date", "Get attendance by date", get_attendance_by_date)

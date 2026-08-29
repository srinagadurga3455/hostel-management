from app.core.http_client import HostelHttpClient
from app.agent.tools.registry import register
from app.agent.types.tool_types import ToolContext

async def get_my_profile(args: dict, ctx: ToolContext):
    client = HostelHttpClient(token=ctx.token)
    res = await client.get("/api/v1/users/me")
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

async def get_my_room(args: dict, ctx: ToolContext):
    client = HostelHttpClient(token=ctx.token)
    # Get profile first to find room
    me = await client.get("/api/v1/users/me")
    if not me.is_success:
        return {"success": False, "error": me.text, "status_code": me.status_code}
    data = me.json()
    student = data.get("student")
    if not student or not student.get("roomId"):
        return {"success": True, "data": {"room": None, "message": "No room assigned"}}
    room_id = student["roomId"]
    res = await client.get(f"/api/v1/rooms/{room_id}")
    if not res.is_success:
        return {"success": False, "error": res.text, "status_code": res.status_code}
    return {"success": True, "data": res.json()}

async def get_room_details(args: dict, ctx: ToolContext):
    room_id = args.get("room_id") or args.get("roomId")
    if room_id:
        client = HostelHttpClient(token=ctx.token)
        res = await client.get(f"/api/v1/rooms/{room_id}")
        if not res.is_success:
            return {"success": False, "error": res.text, "status_code": res.status_code}
        return {"success": True, "data": res.json()}
    return await get_my_room(args, ctx)

register("get_my_profile", "Get authenticated user's profile", get_my_profile)
register("get_profile", "Get authenticated user's profile", get_my_profile)
register("get_my_room", "Get my room details", get_my_room)
register("get_room_details", "Get room details", get_room_details)
register("get_my_hostel", "Get hostel info (via profile)", get_my_profile)
register("get_my_warden", "Get warden info (via profile)", get_my_profile)

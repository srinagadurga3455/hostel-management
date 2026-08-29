from fastapi import APIRouter
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.students import router as students_router
from app.routers.rooms import router as rooms_router
from app.routers.attendance import router as attendance_router
from app.routers.complaints import router as complaints_router
from app.routers.food_menu import router as food_menu_router
from app.routers.outings import router as outings_router
from app.routers.leave import router as leave_router
from app.routers.agent import router as agent_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(students_router)
api_router.include_router(rooms_router)
api_router.include_router(attendance_router)
api_router.include_router(complaints_router)
api_router.include_router(food_menu_router)
api_router.include_router(outings_router)
api_router.include_router(leave_router)
api_router.include_router(agent_router)

@api_router.get("/")
def api_root():
    return {"message": "API v1"}

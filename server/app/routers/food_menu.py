from fastapi import APIRouter
from app.dependencies import DbSession, CurrentUser, WardenUser
from app.schemas.food_menu import CreateFoodMenuDto, UpdateFoodMenuDto
from app.services import food_menu as svc

router = APIRouter(prefix="/food-menu", tags=["Food Menu"])


@router.post("", summary="Create a food menu for a day (warden only)")
def create(dto: CreateFoodMenuDto, db: DbSession, current_user: WardenUser):
    return svc.create(db, dto)


@router.get("", summary="Get all food menus")
def find_all(db: DbSession, current_user: CurrentUser):
    return svc.find_all(db)


@router.get("/{menu_id}", summary="Get a food menu by ID")
def find_one(menu_id: int, db: DbSession, current_user: CurrentUser):
    return svc.find_one(db, menu_id)


@router.patch("/{menu_id}", summary="Update a food menu (warden only)")
def update(menu_id: int, dto: UpdateFoodMenuDto, db: DbSession, current_user: WardenUser):
    return svc.update(db, menu_id, dto)


@router.delete("/{menu_id}", summary="Delete a food menu (warden only)")
def remove(menu_id: int, db: DbSession, current_user: WardenUser):
    return svc.remove(db, menu_id)

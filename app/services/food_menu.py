from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.food_menu import FoodMenu
from app.schemas.food_menu import CreateFoodMenuDto, UpdateFoodMenuDto


def create(db: Session, dto: CreateFoodMenuDto):
    day_val = dto.day.value if hasattr(dto.day, 'value') else dto.day
    existing = db.query(FoodMenu).filter(FoodMenu.day == day_val).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Food menu for {day_val} already exists")
    menu = FoodMenu(day=day_val, breakfast=dto.breakfast, lunch=dto.lunch, snacks=dto.snacks, dinner=dto.dinner)
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return menu


def find_all(db: Session):
    return db.query(FoodMenu).all()


def find_one(db: Session, menu_id: int):
    menu = db.query(FoodMenu).filter(FoodMenu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Food menu #{menu_id} not found")
    return menu


def update(db: Session, menu_id: int, dto: UpdateFoodMenuDto):
    menu = db.query(FoodMenu).filter(FoodMenu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Food menu #{menu_id} not found")
    data = dto.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(menu, k, v)
    db.commit()
    db.refresh(menu)
    return menu


def remove(db: Session, menu_id: int):
    menu = db.query(FoodMenu).filter(FoodMenu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Food menu #{menu_id} not found")
    db.delete(menu)
    db.commit()
    return {"message": f"Food menu #{menu_id} deleted"}

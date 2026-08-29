from app.db.database import SessionLocal
from app.models.food_menu import FoodMenu

# Full week Indian hostel mess menu
MENUS = [
    {
        "day": "MONDAY",
        "breakfast": "Idli, Sambar, Coconut Chutney, Tea",
        "lunch": "Steamed Rice, Sambar, Rasam, Drumstick Curry, Curd, Papad",
        "snacks": "Masala Chai, Samosa, Green Chutney",
        "dinner": "Chapati, Paneer Butter Masala, Jeera Rice, Dal Tadka, Salad",
    },
    {
        "day": "TUESDAY",
        "breakfast": "Poha, Sev, Jalebi, Tea",
        "lunch": "Rice, Rajma Curry, Cabbage Poriyal, Rasam, Curd, Pickle",
        "snacks": "Tea, Vada Pav, Coriander Chutney",
        "dinner": "Chapati, Chicken Curry (Veg: Aloo Gobi), Dal Fry, Rice, Onion Salad",
    },
    {
        "day": "WEDNESDAY",
        "breakfast": "Upma, Coconut Chutney, Banana, Tea",
        "lunch": "Rice, Dal Makhani, Bhindi Masala, Rasam, Curd, Papad",
        "snacks": "Filter Coffee, Bhel Puri",
        "dinner": "Veg Pulao, Raita, Mixed Veg Curry, Chapati, Pickle",
    },
    {
        "day": "THURSDAY",
        "breakfast": "Aloo Paratha, Curd, Pickle, Tea",
        "lunch": "Rice, Sambar, Beetroot Thoran, Lemon Rice, Curd, Papad",
        "snacks": "Masala Chai, Onion Pakora, Mint Chutney",
        "dinner": "Chapati, Egg Curry (Veg: Paneer Bhurji), Dal Tadka, Rice",
    },
    {
        "day": "FRIDAY",
        "breakfast": "Masala Dosa, Sambar, Coconut Chutney, Tea",
        "lunch": "Veg Dum Biryani, Raita, Mirchi Ka Salan, Curd, Papad",
        "snacks": "Tea, Pav Bhaji",
        "dinner": "Chapati, Dal Tadka, Aloo Matar, Curd Rice, Salad",
    },
    {
        "day": "SATURDAY",
        "breakfast": "Puri Bhaji, Tea, Pickle",
        "lunch": "Rice, Chole Masala, Aloo Jeera, Rasam, Curd, Papad",
        "snacks": "Tea, Vegetable Maggi, Biscuits",
        "dinner": "Chapati, Butter Chicken (Veg: Malai Kofta), Jeera Rice, Onion Salad",
    },
    {
        "day": "SUNDAY",
        "breakfast": "Chole Bhature, Lassi, Pickle",
        "lunch": "Rice, Sambar, Avial, Thoran, Payasam, Curd, Papad",
        "snacks": "Tea, Cake, Potato Chips",
        "dinner": "Chapati, Paneer Tikka Masala, Fried Rice, Vanilla Ice Cream",
    },
]

def main():
    db = SessionLocal()
    try:
        print("Clearing food_menus table...")
        db.query(FoodMenu).delete()
        db.commit()
        print("Inserting 7 days Indian menu...")
        for m in MENUS:
            db.add(FoodMenu(**m))
        db.commit()
        rows = db.query(FoodMenu).all()
        print(f"Done. Total rows: {len(rows)}")
        for r in rows:
            print(f" - {r.day}: {r.breakfast[:30]} | {r.lunch[:30]}")
    finally:
        db.close()

if __name__ == "__main__":
    main()

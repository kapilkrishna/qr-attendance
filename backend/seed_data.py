from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, Package, User
from app.crud import create_package, create_user
from datetime import date, timedelta

# Create tables
Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    try:
        # Create sample packages
        packages = [
            {
                "name": "Beginner Tennis",
                "description": "Perfect for new players. Learn basic strokes and court positioning.",
                "price": 25.0,
                "duration_type": "class",
                "num_classes": 10
            },
            {
                "name": "Intermediate Tennis",
                "description": "For players with some experience. Improve technique and strategy.",
                "price": 30.0,
                "duration_type": "class",
                "num_classes": 12
            },
            {
                "name": "Advanced Tennis",
                "description": "For experienced players. Advanced techniques and competitive play.",
                "price": 35.0,
                "duration_type": "class",
                "num_classes": 15
            },
            {
                "name": "Weekly Membership",
                "description": "Unlimited classes per week. Great for dedicated players.",
                "price": 80.0,
                "duration_type": "week",
                "num_weeks": 4
            }
        ]
        
        for package_data in packages:
            existing = db.query(Package).filter(Package.name == package_data["name"]).first()
            if not existing:
                create_package(db, package_data)
                print(f"Created package: {package_data['name']}")
        
        # Create sample users
        users = [
            {
                "name": "John Smith",
                "email": "john.smith@email.com",
                "role": "student"
            },
            {
                "name": "Sarah Johnson",
                "email": "sarah.johnson@email.com",
                "role": "student"
            },
            {
                "name": "Mike Davis",
                "email": "mike.davis@email.com",
                "role": "student"
            },
            {
                "name": "Lisa Wilson",
                "email": "lisa.wilson@email.com",
                "role": "parent"
            },
            {
                "name": "Coach Tom",
                "email": "coach.tom@tennisacademy.com",
                "role": "coach"
            }
        ]
        
        for user_data in users:
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing:
                create_user(db, user_data)
                print(f"Created user: {user_data['name']}")
        
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data() 
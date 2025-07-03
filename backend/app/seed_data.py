from sqlalchemy.orm import Session
from . import models, crud, schemas
from datetime import date, timedelta

def seed_database(db: Session):
    """Seed the database with initial data"""
    print("Seeding database...")
    
    # Create class types
    class_types = [
        {"name": "Beginner Tennis", "description": "Basic tennis skills for beginners"},
        {"name": "Intermediate Tennis", "description": "Advanced techniques for intermediate players"},
        {"name": "Advanced Tennis", "description": "Professional level training"}
    ]
    
    for class_type_data in class_types:
        existing = db.query(models.ClassType).filter(models.ClassType.name == class_type_data["name"]).first()
        if not existing:
            class_type = models.ClassType(**class_type_data)
            db.add(class_type)
            print(f"Created class type: {class_type_data['name']}")
    
    db.commit()
    
    # Get class types
    beginner_type = db.query(models.ClassType).filter(models.ClassType.name == "Beginner Tennis").first()
    intermediate_type = db.query(models.ClassType).filter(models.ClassType.name == "Intermediate Tennis").first()
    
    # Create packages
    packages = [
        {
            "name": "Beginner Package - 4 Classes",
            "description": "4 beginner tennis classes",
            "price": 120.0,
            "duration_type": "class",
            "num_classes": 4,
            "class_type_id": beginner_type.id if beginner_type else None
        },
        {
            "name": "Intermediate Package - 8 Classes",
            "description": "8 intermediate tennis classes",
            "price": 200.0,
            "duration_type": "class",
            "num_classes": 8,
            "class_type_id": intermediate_type.id if intermediate_type else None
        }
    ]
    
    for package_data in packages:
        existing = db.query(models.Package).filter(models.Package.name == package_data["name"]).first()
        if not existing:
            package = models.Package(**package_data)
            db.add(package)
            print(f"Created package: {package_data['name']}")
    
    db.commit()
    
    # Get packages
    beginner_package = db.query(models.Package).filter(models.Package.name == "Beginner Package - 4 Classes").first()
    intermediate_package = db.query(models.Package).filter(models.Package.name == "Intermediate Package - 8 Classes").first()
    
    # Create test users
    test_users = [
        {"name": "John Doe", "email": "john@example.com", "role": "student"},
        {"name": "Jane Smith", "email": "jane@example.com", "role": "student"},
        {"name": "Bob Wilson", "email": "bob@example.com", "role": "student"}
    ]
    
    for user_data in test_users:
        existing = db.query(models.User).filter(models.User.email == user_data["email"]).first()
        if not existing:
            user = models.User(**user_data)
            db.add(user)
            print(f"Created user: {user_data['name']}")
    
    db.commit()
    
    # Get users
    john = db.query(models.User).filter(models.User.email == "john@example.com").first()
    jane = db.query(models.User).filter(models.User.email == "jane@example.com").first()
    
    # Create registrations
    today = date.today()
    registrations = [
        {
            "user_id": john.id if john else None,
            "package_id": beginner_package.id if beginner_package else None,
            "start_date": today,
            "end_date": today + timedelta(days=30),
            "status": "active"
        },
        {
            "user_id": jane.id if jane else None,
            "package_id": intermediate_package.id if intermediate_package else None,
            "start_date": today,
            "end_date": today + timedelta(days=60),
            "status": "active"
        }
    ]
    
    for reg_data in registrations:
        if reg_data["user_id"] and reg_data["package_id"]:
            existing = db.query(models.Registration).filter(
                models.Registration.user_id == reg_data["user_id"],
                models.Registration.package_id == reg_data["package_id"]
            ).first()
            if not existing:
                registration = models.Registration(**reg_data)
                db.add(registration)
                print(f"Created registration for user {reg_data['user_id']}")
    
    db.commit()
    print("Database seeding completed!")

if __name__ == "__main__":
    from .database import SessionLocal
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close() 
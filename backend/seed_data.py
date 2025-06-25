from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, Package, User
from app.crud import create_package, create_user
from app.schemas import PackageCreate, UserCreate
from datetime import date, timedelta

# Create tables
Base.metadata.create_all(bind=engine)

def clean_db():
    db = SessionLocal()
    try:
        # Delete all users
        db.query(User).delete()
        db.commit()
        # Delete all packages except the three specified
        keep_names = [
            "Elite Program Daily",
            "Elite Program 1 Week",
            "Elite Program 9 Weeks"
        ]
        db.query(Package).filter(~Package.name.in_(keep_names)).delete(synchronize_session=False)
        db.commit()
        print("All users deleted. Only specified packages kept.")
    finally:
        db.close()

def seed_data():
    db = SessionLocal()
    
    try:
        # Create only the three specified packages if they don't exist
        packages = [
            PackageCreate(
                name="Elite Program Daily",
                description="Monday to Friday 2:00PM - 4:00PM 4:30PM - 6:30PM",
                price=80.0,
                duration_type="class",
                num_classes=1
            ),
            PackageCreate(
                name="Elite Program 1 Week",
                description="Monday to Friday 2:00PM - 4:00PM 4:30PM - 6:30PM",
                price=400.0,
                duration_type="week",
                num_classes=5,
                num_weeks=1
            ),
            PackageCreate(
                name="Elite Program 9 Weeks",
                description="Monday to Friday 2:00PM - 4:00PM 4:30PM - 6:30PM",
                price=3600.0,
                duration_type="week",
                num_classes=40,
                num_weeks=9
            )
        ]
        
        for package_data in packages:
            existing = db.query(Package).filter(Package.name == package_data.name).first()
            if not existing:
                create_package(db, package_data)
                print(f"Created package: {package_data.name}")
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clean_db()
    seed_data() 
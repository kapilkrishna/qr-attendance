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
        # Delete all packages except the WCRA Single Session package
        keep_names = [
            "WCRA Single Session (Members)"
        ]
        db.query(Package).filter(~Package.name.in_(keep_names)).delete(synchronize_session=False)
        db.commit()
        print("All users deleted. Only WCRA Single Session package kept.")
    finally:
        db.close()

def seed_data():
    db = SessionLocal()
    
    try:
        # Create the WCRA Single Session (Members) package if it doesn't exist
        packages = [
            PackageCreate(
                name="WCRA Single Session (Members)",
                description="Pick any single Wednesday during our Summer session (June 19 - August 14). Beginner/Intermediate goes from 7 - 8 pm. Advanced goes from 8 - 9:30 PM. Member prices are for WCRA members only.",
                price=25.0,
                duration_type="class",
                num_classes=1
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
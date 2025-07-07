#!/usr/bin/env python3
"""
Seed script to add initial package and class data
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Package, Class
from datetime import datetime, time

def seed_data():
    db = SessionLocal()
    try:
        # Check if package already exists
        existing_package = db.query(Package).filter(Package.name == "Elite Summer Camp").first()
        if existing_package:
            print(f"Package 'Elite Summer Camp' already exists with ID: {existing_package.id}")
            package = existing_package
        else:
            # Create the package
            package = Package(
                name="Elite Summer Camp",
                description="Elite Summer Tennis Camp 2025",
                price=500.00,
                start_date=datetime(2025, 7, 7),
                end_date=datetime(2025, 8, 15)
            )
            db.add(package)
            db.commit()
            db.refresh(package)
            print(f"Created package 'Elite Summer Camp' with ID: {package.id}")

        # Check if class already exists
        existing_class = db.query(Class).filter(
            Class.package_id == package.id,
            Class.date == datetime(2025, 7, 7).date()
        ).first()
        
        if existing_class:
            print(f"Class for July 7, 2025 already exists with ID: {existing_class.id}")
        else:
            # Create the class
            class_obj = Class(
                package_id=package.id,
                date=datetime(2025, 7, 7).date(),
                start_time=time(9, 0),
                end_time=time(11, 0),
                location="Tennis Courts"
            )
            db.add(class_obj)
            db.commit()
            db.refresh(class_obj)
            print(f"Created class for July 7, 2025 with ID: {class_obj.id}")

        print("\nCurrent data:")
        print("Packages:")
        packages = db.query(Package).all()
        for p in packages:
            print(f"  - {p.name} (ID: {p.id})")
        
        print("\nClasses:")
        classes = db.query(Class).all()
        for c in classes:
            package_name = db.query(Package).filter(Package.id == c.package_id).first().name
            print(f"  - {package_name} - {c.date} (ID: {c.id})")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data() 
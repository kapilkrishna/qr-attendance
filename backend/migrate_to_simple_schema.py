#!/usr/bin/env python3
"""
Migration script to convert from complex schema to simplified schema.
This script will:
1. Create new tables with simplified schema
2. Migrate existing data
3. Drop old tables
"""

import sys
import os
from datetime import datetime, date
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, get_db
from app.models_simple import User, Package, Class, Attendance

def migrate_to_simple_schema():
    """Migrate from complex schema to simplified schema"""
    
    # Create engine for the current database
    engine = create_engine("sqlite:///./tennis_academy.db")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create new tables
    Base.metadata.create_all(bind=engine)
    
    session = SessionLocal()
    
    try:
        print("Starting migration to simplified schema...")
        
        # 1. Migrate Users (no changes needed)
        print("Migrating users...")
        old_users = session.execute(text("SELECT id, name, email, role FROM users")).fetchall()
        for old_user in old_users:
            new_user = User(
                id=old_user.id,
                name=old_user.name,
                email=old_user.email,
                role=old_user.role
            )
            session.add(new_user)
        
        # 2. Migrate Packages (simplified)
        print("Migrating packages...")
        old_packages = session.execute(text("""
            SELECT p.id, p.name, p.description, p.price, 
                   po.start_date, po.end_date
            FROM packages p
            LEFT JOIN package_options po ON p.id = po.package_id
            WHERE po.id = (SELECT MIN(id) FROM package_options WHERE package_id = p.id)
        """)).fetchall()
        
        for old_pkg in old_packages:
            # Extract class days from the first option's label
            first_option = session.execute(text("""
                SELECT label FROM package_options 
                WHERE package_id = ? ORDER BY id LIMIT 1
            """), (old_pkg.id,)).fetchone()
            
            class_days = "Monday,Tuesday,Wednesday,Thursday,Friday"  # Default
            if first_option and "Monday" in first_option.label:
                class_days = "Monday,Tuesday,Wednesday,Thursday,Friday"
            elif first_option and "Monday" in first_option.label:
                class_days = "Monday"
            
            new_package = Package(
                id=old_pkg.id,
                name=old_pkg.name,
                description=old_pkg.description,
                price=old_pkg.price or 0,
                start_date=old_pkg.start_date or date(2025, 6, 16),
                end_date=old_pkg.end_date or date(2025, 8, 15),
                class_days=class_days
            )
            session.add(new_package)
        
        # 3. Migrate Classes (simplified)
        print("Migrating classes...")
        old_classes = session.execute(text("""
            SELECT c.id, c.date, c.package_id, c.class_type_id, c.cancelled
            FROM classes c
        """)).fetchall()
        
        for old_class in old_classes:
            # Get package info for time and location
            package = session.execute(text("""
                SELECT name FROM packages WHERE id = ?
            """), (old_class.package_id,)).fetchone()
            
            time = "1:00 PM"  # Default
            location = "Holmes Middle School"  # Default
            
            if package and "Elite Summer" in package.name:
                time = "1:00 PM"
                location = "Holmes Middle School"
            
            new_class = Class(
                id=old_class.id,
                package_id=old_class.package_id,
                date=old_class.date,
                time=time,
                location=location,
                active=not old_class.cancelled
            )
            session.add(new_class)
        
        # 4. Migrate Attendance (no changes needed)
        print("Migrating attendance...")
        old_attendance = session.execute(text("""
            SELECT id, class_id, user_id, status, checked_in_at
            FROM attendance
        """)).fetchall()
        
        for old_att in old_attendance:
            new_attendance = Attendance(
                id=old_att.id,
                class_id=old_att.class_id,
                user_id=old_att.user_id,
                status=old_att.status,
                checked_in_at=old_att.checked_in_at
            )
            session.add(new_attendance)
        
        # Commit all changes
        session.commit()
        print("Migration completed successfully!")
        
        # 5. Verify migration
        print("\nVerifying migration...")
        user_count = session.query(User).count()
        package_count = session.query(Package).count()
        class_count = session.query(Class).count()
        attendance_count = session.query(Attendance).count()
        
        print(f"Users: {user_count}")
        print(f"Packages: {package_count}")
        print(f"Classes: {class_count}")
        print(f"Attendance records: {attendance_count}")
        
    except Exception as e:
        session.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    migrate_to_simple_schema() 
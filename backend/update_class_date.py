#!/usr/bin/env python3
"""
Update all classes with date 2025-07-06 to 2025-07-07
"""
from app.database import SessionLocal
from app.models import Class
from datetime import date

def update_class_date():
    db = SessionLocal()
    try:
        old_date = date(2025, 7, 6)
        new_date = date(2025, 7, 7)
        classes = db.query(Class).filter(Class.date == old_date).all()
        count = 0
        for c in classes:
            c.date = new_date
            count += 1
        db.commit()
        print(f"Updated {count} class(es) from {old_date} to {new_date}.")
    except Exception as e:
        print(f"Error updating class dates: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_class_date() 
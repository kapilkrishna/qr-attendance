#!/usr/bin/env python3
"""
Delete all attendance records for a given class_id.
"""
from app.database import SessionLocal
from app.models import Attendance

if __name__ == "__main__":
    class_id = int(input("Enter the class_id to delete all attendance for: "))
    db = SessionLocal()
    try:
        records = db.query(Attendance).filter(Attendance.class_id == class_id).all()
        count = len(records)
        for record in records:
            db.delete(record)
        db.commit()
        print(f"Deleted {count} attendance record(s) for class_id {class_id}.")
    except Exception as e:
        print(f"Error deleting attendance: {e}")
        db.rollback()
    finally:
        db.close() 
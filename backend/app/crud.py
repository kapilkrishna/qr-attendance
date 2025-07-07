from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, date, time
from . import models
from . import schemas

# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session):
    return db.query(models.User).all()

def create_user(db: Session, name: str, email: str, role: str = "student"):
    db_user = models.User(name=name, email=email, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

# Package CRUD operations
def get_package(db: Session, package_id: int):
    return db.query(models.Package).filter(models.Package.id == package_id).first()

def get_packages(db: Session):
    return db.query(models.Package).all()

def create_package(db: Session, name: str, description: str, price: float, start_date: date, end_date: date):
    db_package = models.Package(
        name=name,
        description=description,
        price=price,
        start_date=start_date,
        end_date=end_date
    )
    db.add(db_package)
    db.commit()
    db.refresh(db_package)
    return db_package

# Class CRUD operations
def get_class(db: Session, class_id: int):
    return db.query(models.Class).filter(models.Class.id == class_id).first()

def get_classes(db: Session):
    return db.query(models.Class).all()

def create_class(db: Session, package_id: int, date: date, start_time: time, end_time: time, location: str):
    db_class = models.Class(
        package_id=package_id,
        date=date,
        start_time=start_time,
        end_time=end_time,
        location=location
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

def get_classes_by_date_package(db: Session, date: date, package_id: int):
    return db.query(models.Class).filter(
        and_(
            models.Class.date == date,
            models.Class.package_id == package_id
        )
    ).all()

def get_classes_by_package(db: Session, package_id: int, start_date: date = None, end_date: date = None):
    query = db.query(models.Class).filter(models.Class.package_id == package_id)
    if start_date:
        query = query.filter(models.Class.date >= start_date)
    if end_date:
        query = query.filter(models.Class.date <= end_date)
    return query.all()

def cancel_class(db: Session, class_id: int):
    db_class = get_class(db, class_id)
    if db_class:
        db_class.cancelled = True
        db.commit()
        db.refresh(db_class)
    return db_class

# Attendance CRUD operations
def get_attendance(db: Session, class_id: int):
    return db.query(models.Attendance).filter(models.Attendance.class_id == class_id).all()

def get_class_attendance(db: Session, class_id: int):
    return db.query(models.Attendance).filter(models.Attendance.class_id == class_id).all()

def get_user_attendance(db: Session, user_id: int, start_date: date = None, end_date: date = None):
    query = db.query(models.Attendance).join(models.Class).filter(models.Attendance.user_id == user_id)
    if start_date:
        query = query.filter(models.Class.date >= start_date)
    if end_date:
        query = query.filter(models.Class.date <= end_date)
    return query.all()

def mark_attendance(db: Session, class_id: int, user_id: int, status: str = "present"):
    # Check if attendance already exists
    existing = db.query(models.Attendance).filter(
        and_(
            models.Attendance.class_id == class_id,
            models.Attendance.user_id == user_id
        )
    ).first()
    
    if existing:
        existing.status = status
        existing.checked_in_at = datetime.now()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        attendance = models.Attendance(
            class_id=class_id,
            user_id=user_id,
            status=status
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        return attendance

def create_attendance(db: Session, attendance: schemas.AttendanceCreate):
    db_attendance = models.Attendance(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def update_attendance_status(db: Session, class_id: int, user_id: int, status: str):
    attendance = db.query(models.Attendance).filter(
        and_(
            models.Attendance.class_id == class_id,
            models.Attendance.user_id == user_id
        )
    ).first()
    
    if attendance:
        attendance.status = status
        attendance.checked_in_at = datetime.now()
        db.commit()
        db.refresh(attendance)
        return attendance
    return None

def delete_attendance_record(db: Session, class_id: int, user_id: int):
    attendance = db.query(models.Attendance).filter(
        and_(
            models.Attendance.class_id == class_id,
            models.Attendance.user_id == user_id
        )
    ).first()
    
    if attendance:
        db.delete(attendance)
        db.commit()
        return True
    return False

# Utility functions
def find_user_by_qr_data(db: Session, qr_data: str):
    """Find user by QR code data (email or name)"""
    # Try to find by email first
    user = get_user_by_email(db, qr_data)
    if user:
        return user
    
    # If not found by email, try to find by name
    user = db.query(models.User).filter(models.User.name == qr_data).first()
    return user

def get_comprehensive_attendance_for_class(db: Session, class_id: int):
    """Get comprehensive attendance data for a class including all users"""
    class_record = get_class(db, class_id)
    if not class_record:
        return []
    
    # Get all users
    all_users = get_users(db)
    
    # Get existing attendance records for this class
    existing_attendance = get_class_attendance(db, class_id)
    attendance_dict = {att.user_id: att for att in existing_attendance}
    
    # Build comprehensive list
    comprehensive_attendance = []
    for user in all_users:
        if user.role == "student":  # Only include students
            attendance_record = attendance_dict.get(user.id)
            comprehensive_attendance.append({
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "status": attendance_record.status if attendance_record else "missing",
                "checked_in_at": attendance_record.checked_in_at if attendance_record else None,
                "attendance_id": attendance_record.id if attendance_record else None
            })
    
    return comprehensive_attendance

def create_user_for_attendance(db: Session, name: str, email: str = None):
    """Create a new user for attendance tracking"""
    if email:
        # Check if user already exists
        existing_user = get_user_by_email(db, email)
        if existing_user:
            return existing_user
    
    # Create new user
    return create_user(db, name=name, email=email or f"{name.lower().replace(' ', '.')}@example.com", role="student") 
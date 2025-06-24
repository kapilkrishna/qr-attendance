from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import date, datetime, timedelta
import uuid
from typing import List, Optional
from . import models, schemas

# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Package CRUD operations
def get_package(db: Session, package_id: int):
    return db.query(models.Package).filter(models.Package.id == package_id).first()

def get_packages(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Package).offset(skip).limit(limit).all()

def create_package(db: Session, package: schemas.PackageCreate):
    db_package = models.Package(**package.dict())
    db.add(db_package)
    db.commit()
    db.refresh(db_package)
    return db_package

# Registration CRUD operations
def get_registration(db: Session, registration_id: int):
    return db.query(models.Registration).filter(models.Registration.id == registration_id).first()

def get_user_registrations(db: Session, user_id: int):
    return db.query(models.Registration).filter(models.Registration.user_id == user_id).all()

def get_active_registrations(db: Session, user_id: int):
    return db.query(models.Registration).filter(
        and_(
            models.Registration.user_id == user_id,
            models.Registration.status == "active"
        )
    ).all()

def create_registration(db: Session, registration: schemas.RegistrationCreate):
    db_registration = models.Registration(**registration.dict())
    db.add(db_registration)
    db.commit()
    db.refresh(db_registration)
    return db_registration

# Class CRUD operations
def get_class(db: Session, class_id: int):
    return db.query(models.Class).filter(models.Class.id == class_id).first()

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

def create_class(db: Session, class_data: schemas.ClassCreate):
    db_class = models.Class(**class_data.dict())
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

def cancel_class(db: Session, class_id: int):
    db_class = get_class(db, class_id)
    if db_class:
        db_class.cancelled = True
        db.commit()
        db.refresh(db_class)
    return db_class

# Attendance CRUD operations
def get_attendance(db: Session, attendance_id: int):
    return db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()

def get_class_attendance(db: Session, class_id: int):
    return db.query(models.Attendance).filter(models.Attendance.class_id == class_id).all()

def get_user_attendance(db: Session, user_id: int, start_date: date = None, end_date: date = None):
    query = db.query(models.Attendance).join(models.Class).filter(models.Attendance.user_id == user_id)
    if start_date:
        query = query.filter(models.Class.date >= start_date)
    if end_date:
        query = query.filter(models.Class.date <= end_date)
    return query.all()

def create_attendance(db: Session, attendance: schemas.AttendanceCreate):
    db_attendance = models.Attendance(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def mark_attendance(db: Session, class_id: int, user_id: int, present: bool = True):
    # Check if attendance record already exists
    existing = db.query(models.Attendance).filter(
        and_(
            models.Attendance.class_id == class_id,
            models.Attendance.user_id == user_id
        )
    ).first()
    
    if existing:
        existing.present = present
        existing.checked_in_at = datetime.now()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        attendance = models.Attendance(
            class_id=class_id,
            user_id=user_id,
            present=present
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        return attendance

# Payment CRUD operations
def get_payment(db: Session, payment_id: int):
    return db.query(models.Payment).filter(models.Payment.id == payment_id).first()

def get_user_payments(db: Session, user_id: int):
    return db.query(models.Payment).filter(models.Payment.user_id == user_id).all()

def get_payment_by_invoice_code(db: Session, invoice_code: str):
    return db.query(models.Payment).filter(models.Payment.invoice_code == invoice_code).first()

def create_payment(db: Session, payment: schemas.PaymentCreate):
    db_payment = models.Payment(**payment.dict())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

def update_payment_status(db: Session, payment_id: int, amount_paid: float, payment_method: str = None):
    db_payment = get_payment(db, payment_id)
    if db_payment:
        db_payment.amount_paid = amount_paid
        db_payment.paid = amount_paid >= db_payment.amount_due
        db_payment.payment_method = payment_method
        db_payment.payment_date = date.today()
        db.commit()
        db.refresh(db_payment)
    return db_payment

# Business logic functions
def generate_invoice_code():
    """Generate a unique invoice code"""
    return f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

def calculate_monthly_bill(db: Session, user_id: int, month: str):
    """Calculate bill for a user for a specific month"""
    # Parse month (format: "2024-07")
    year, month_num = month.split("-")
    start_date = date(int(year), int(month_num), 1)
    if int(month_num) == 12:
        end_date = date(int(year) + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(int(year), int(month_num) + 1, 1) - timedelta(days=1)
    
    # Get user's active registrations
    registrations = get_active_registrations(db, user_id)
    
    total_amount = 0
    for registration in registrations:
        # Get classes for this registration's package in the month
        classes = get_classes_by_package(db, registration.package_id, start_date, end_date)
        
        # Count non-cancelled classes
        class_count = sum(1 for c in classes if not c.cancelled)
        
        # Calculate amount based on package pricing
        package = registration.package
        if package.duration_type == "class":
            total_amount += class_count * package.price
        elif package.duration_type == "week":
            # For weekly packages, calculate based on weeks in month
            weeks_in_month = (end_date - start_date).days // 7 + 1
            total_amount += weeks_in_month * package.price
    
    return total_amount

def generate_monthly_invoices(db: Session, month: str):
    """Generate invoices for all users for a specific month"""
    users = get_users(db)
    invoices = []
    
    for user in users:
        if user.role in ["student", "parent"]:
            amount_due = calculate_monthly_bill(db, user.id, month)
            if amount_due > 0:
                invoice_code = generate_invoice_code()
                payment = models.Payment(
                    user_id=user.id,
                    month=month,
                    invoice_code=invoice_code,
                    amount_due=amount_due
                )
                db.add(payment)
                invoices.append(payment)
    
    db.commit()
    return invoices

def find_user_by_qr_data(db: Session, qr_data: str):
    """Find user by QR code data (name)"""
    return db.query(models.User).filter(models.User.name == qr_data).first()

def check_user_registration_for_class(db: Session, user_id: int, class_id: int):
    """Check if user is registered for a specific class"""
    class_record = get_class(db, class_id)
    if not class_record:
        return False
    
    # Check if user has any active registrations (for any package)
    active_registrations = get_active_registrations(db, user_id)
    return len(active_registrations) > 0

def get_package_options(db: Session, package_id: int):
    return db.query(models.PackageOption).filter(models.PackageOption.package_id == package_id).all()

def create_package_option(db: Session, package_id: int, option: schemas.PackageOptionCreate):
    db_option = models.PackageOption(**option.dict(), package_id=package_id)
    db.add(db_option)
    db.commit()
    db.refresh(db_option)
    return db_option

def delete_package_option(db: Session, option_id: int):
    option = db.query(models.PackageOption).filter(models.PackageOption.id == option_id).first()
    if option:
        db.delete(option)
        db.commit()
    return option

def get_class_types(db: Session):
    return db.query(models.ClassType).all()

def create_class_type(db: Session, class_type: schemas.ClassTypeCreate):
    db_type = models.ClassType(**class_type.dict())
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type

def delete_class_type(db: Session, type_id: int):
    db_type = db.query(models.ClassType).filter(models.ClassType.id == type_id).first()
    if db_type:
        db.delete(db_type)
        db.commit()
    return db_type

def get_class_by_date_and_type(db: Session, date: date, class_type_id: int):
    return db.query(models.Class).filter(
        models.Class.date == date,
        models.Class.class_type_id == class_type_id
    ).first()

def get_or_create_class_by_date_and_type(db: Session, date: date, class_type_id: int):
    db_class = get_class_by_date_and_type(db, date, class_type_id)
    if db_class:
        return db_class
    # Create new class
    new_class = models.Class(date=date, class_type_id=class_type_id)
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class 
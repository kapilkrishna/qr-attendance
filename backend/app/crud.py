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
    today = date.today()
    print(f"[DEBUG] Checking active registrations for user {user_id} on date: {today}")
    
    registrations = db.query(models.Registration).filter(
        and_(
            models.Registration.user_id == user_id,
            models.Registration.status == "active",
            models.Registration.start_date <= today,
            models.Registration.end_date >= today
        )
    ).all()
    
    print(f"[DEBUG] Found {len(registrations)} registrations")
    for reg in registrations:
        print(f"[DEBUG] Registration {reg.id}: start_date={reg.start_date}, end_date={reg.end_date}, package={reg.package.name}")
    
    return registrations

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

def check_user_registration_for_class(db: Session, user_id: int, class_id: int):
    """Check if user is registered for a specific class"""
    class_record = get_class(db, class_id)
    if not class_record:
        return False
    
    # Check if user has any active registrations (for any package)
    active_registrations = get_active_registrations(db, user_id)
    return len(active_registrations) > 0

def get_class_type_name(db: Session, class_type_id: int):
    """Get class type name by ID"""
    class_type = db.query(models.ClassType).filter(models.ClassType.id == class_type_id).first()
    return class_type.name if class_type else "Unknown"

def check_user_registration_for_class_type_and_date(db: Session, user_id: int, class_type_id: int, class_date: date):
    """Check if user is registered for a specific class type and date"""
    # Get user's active registrations
    active_registrations = get_active_registrations(db, user_id)
    
    if not active_registrations:
        return False, "No active registrations found"
    
    # Check if any registration covers this date AND class type
    for registration in active_registrations:
        # Check date range
        if registration.start_date <= class_date <= registration.end_date:
            # Check if package is for the correct class type
            if registration.package.class_type_id == class_type_id:
                return True, f"Registered for {registration.package.class_type.name} on this date"
            else:
                return False, f"Registered for {registration.package.class_type.name} but attending {get_class_type_name(db, class_type_id)}"
    
    return False, "Not registered for this date"

def mark_attendance_with_validation(db: Session, class_id: int, user_id: int, status: str = "present"):
    """Mark attendance with validation and return detailed status"""
    class_record = get_class(db, class_id)
    if not class_record:
        return None, "Class not found"
    
    # Check if user is registered for this class type and date
    is_registered, registration_message = check_user_registration_for_class_type_and_date(
        db, user_id, class_record.class_type_id, class_record.date
    )
    
    # Check if already marked present
    existing = db.query(models.Attendance).filter(
        and_(
            models.Attendance.class_id == class_id,
            models.Attendance.user_id == user_id
        )
    ).first()
    
    if existing and existing.status in ["present", "late"]:
        return existing, f"Already marked {existing.status}", True, registration_message
    
    # Mark attendance (regardless of registration status, but flag it)
    if existing:
        existing.status = status
        existing.checked_in_at = datetime.now()
        db.commit()
        db.refresh(existing)
        attendance_record = existing
    else:
        attendance = models.Attendance(
            class_id=class_id,
            user_id=user_id,
            status=status
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        attendance_record = attendance
    
    return attendance_record, "Attendance marked successfully", is_registered, registration_message

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

def get_unchecked_students_for_class(db: Session, class_id: int):
    """Get all registered students who haven't checked in for a specific class"""
    class_record = get_class(db, class_id)
    if not class_record:
        return []
    
    # Get all users with active registrations for this class type and date
    active_registrations = db.query(models.Registration).filter(
        and_(
            models.Registration.status == "active",
            models.Registration.start_date <= class_record.date,
            models.Registration.end_date >= class_record.date,
            models.Registration.package.has(class_type_id=class_record.class_type_id)
        )
    ).all()
    
    # Get user IDs who are registered
    registered_user_ids = [reg.user_id for reg in active_registrations]
    
    # Get user IDs who have already checked in
    checked_in_user_ids = db.query(models.Attendance.user_id).filter(
        and_(
            models.Attendance.class_id == class_id,
            models.Attendance.status == "present"
        )
    ).all()
    checked_in_user_ids = [user_id[0] for user_id in checked_in_user_ids]
    
    # Get users who are registered but haven't checked in
    unchecked_user_ids = list(set(registered_user_ids) - set(checked_in_user_ids))
    
    # Get full user details
    unchecked_students = db.query(models.User).filter(
        models.User.id.in_(unchecked_user_ids)
    ).all()
    
    return unchecked_students

def update_attendance_status(db: Session, class_id: int, user_id: int, status: str):
    """Update attendance status for a specific student"""
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
    else:
        # Create new attendance record
        attendance = models.Attendance(
            class_id=class_id,
            user_id=user_id,
            status=status
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        return attendance

def get_comprehensive_attendance_for_class(db: Session, class_id: int):
    """Get comprehensive attendance data including checked-in and unchecked students"""
    class_record = get_class(db, class_id)
    if not class_record:
        return {"checked_in": [], "unchecked": [], "missing": []}
    
    # Get all attendance records for this class
    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.class_id == class_id
    ).all()
    
    # Get all users with active registrations for this class type and date
    active_registrations = db.query(models.Registration).filter(
        and_(
            models.Registration.status == "active",
            models.Registration.start_date <= class_record.date,
            models.Registration.end_date >= class_record.date
        )
    ).all()
    
    # Get package IDs for this class type
    package_ids = [reg.package_id for reg in active_registrations]
    packages_with_class_type = db.query(models.Package).filter(
        and_(
            models.Package.id.in_(package_ids),
            models.Package.class_type_id == class_record.class_type_id
        )
    ).all()
    valid_package_ids = [p.id for p in packages_with_class_type]
    
    # Get registered users for this class
    registered_users = db.query(models.User).join(models.Registration).filter(
        and_(
            models.Registration.package_id.in_(valid_package_ids),
            models.Registration.status == "active",
            models.Registration.start_date <= class_record.date,
            models.Registration.end_date >= class_record.date
        )
    ).all()
    
    # Organize data
    checked_in = []
    unchecked = []
    missing = []
    
    # Process checked-in students
    for record in attendance_records:
        user = get_user(db, record.user_id)
        if user:
            checked_in.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "status": record.status,
                "checked_in_at": record.checked_in_at,
                "is_registered": True
            })
    
    # Process unchecked students
    checked_in_user_ids = [record.user_id for record in attendance_records]
    for user in registered_users:
        if user.id not in checked_in_user_ids:
            unchecked.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "status": "unchecked",
                "is_registered": True
            })
    
    # Process missing students (marked as missing)
    for record in attendance_records:
        if record.status == "missing":
            user = get_user(db, record.user_id)
            if user:
                missing.append({
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "status": record.status,
                    "checked_in_at": record.checked_in_at,
                    "is_registered": True
                })
    
    return {
        "checked_in": checked_in,
        "unchecked": unchecked,
        "missing": missing
    }

def create_user_for_attendance(db: Session, name: str, email: str = None):
    """Create a new user for manual attendance entry"""
    # Generate email if not provided
    if not email:
        email = f"{name.lower().replace(' ', '.')}@manual.entry"
    
    # Check if user already exists
    existing_user = get_user_by_email(db, email)
    if existing_user:
        return existing_user
    
    # Create new user
    user = models.User(
        name=name,
        email=email,
        role="student"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def delete_attendance_record(db: Session, class_id: int, user_id: int):
    """Delete attendance record for a specific student in a class"""
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
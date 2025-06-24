from fastapi import FastAPI, Depends, HTTPException, status, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import qrcode
import io
import base64
from datetime import date, datetime

from . import crud, models, schemas
from .database import SessionLocal, engine
from .email_service import EmailService

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tennis Academy MVP API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Email service
email_service = EmailService()

# Coach authentication
COACH_PASSWORD = "tennis123"  # In production, use environment variable

@app.post("/api/coach/auth", response_model=schemas.CoachAuthResponse)
def authenticate_coach(auth: schemas.CoachAuthRequest):
    """Authenticate coach with password"""
    if auth.password == COACH_PASSWORD:
        return schemas.CoachAuthResponse(authenticated=True, message="Authentication successful")
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

# User endpoints
@app.post("/api/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/api/users", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all users"""
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

# Package endpoints
@app.get("/api/packages", response_model=List[schemas.Package])
def read_packages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all packages"""
    packages = crud.get_packages(db, skip=skip, limit=limit)
    return packages

@app.post("/api/packages", response_model=schemas.Package)
def create_package(package: schemas.PackageCreate, db: Session = Depends(get_db)):
    """Create a new package"""
    return crud.create_package(db=db, package=package)

@app.delete("/api/packages/{package_id}")
def delete_package(package_id: int, db: Session = Depends(get_db)):
    package = crud.get_package(db, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    db.delete(package)
    db.commit()
    return {"message": "Package deleted"}

# Package Option endpoints
@app.get("/api/packages/{package_id}/options", response_model=List[schemas.PackageOption])
def get_package_options(package_id: int, db: Session = Depends(get_db)):
    return crud.get_package_options(db, package_id)

@app.post("/api/packages/{package_id}/options", response_model=schemas.PackageOption)
def create_package_option(package_id: int, option: schemas.PackageOptionCreate, db: Session = Depends(get_db)):
    return crud.create_package_option(db, package_id, option)

@app.delete("/api/package_options/{option_id}")
def delete_package_option(option_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_package_option(db, option_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Option not found")
    return {"message": "Option deleted"}

# Registration endpoints
@app.post("/api/register", response_model=schemas.Registration)
def register_user(registration: schemas.RegistrationCreate, db: Session = Depends(get_db)):
    """Register a user for a package"""
    # Check if user exists
    user = crud.get_user(db, registration.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if package exists
    package = crud.get_package(db, registration.package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Create registration
    db_registration = crud.create_registration(db=db, registration=registration)
    
    # Send confirmation email
    email_service.send_registration_confirmation(
        user_email=user.email,
        user_name=user.name,
        package_name=package.name
    )
    
    return db_registration

@app.get("/api/registrations/user/{user_id}", response_model=List[schemas.Registration])
def read_user_registrations(user_id: int, db: Session = Depends(get_db)):
    """Get all registrations for a user"""
    registrations = crud.get_user_registrations(db, user_id=user_id)
    return registrations

# Class endpoints
@app.get("/api/classes", response_model=List[schemas.Class])
def read_classes(package_id: int = None, date: date = None, db: Session = Depends(get_db)):
    """Get classes with optional filtering"""
    if package_id and date:
        classes = crud.get_classes_by_date_package(db, date=date, package_id=package_id)
    elif package_id:
        classes = crud.get_classes_by_package(db, package_id=package_id)
    else:
        # Get all classes (you might want to add pagination)
        classes = db.query(models.Class).all()
    return classes

@app.post("/api/classes", response_model=schemas.Class)
def create_class(class_data: schemas.ClassCreate, db: Session = Depends(get_db)):
    """Create a new class"""
    return crud.create_class(db=db, class_data=class_data)

@app.post("/api/cancel_class/{class_id}")
def cancel_class_endpoint(class_id: int, db: Session = Depends(get_db)):
    """Cancel a class"""
    db_class = crud.cancel_class(db, class_id=class_id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get package info for email
    package = crud.get_package(db, db_class.package_id)
    
    # Get all users registered for this package
    registrations = crud.get_active_registrations(db, user_id=None)  # Get all active registrations
    user_emails = []
    for reg in registrations:
        if reg.package_id == db_class.package_id:
            user = crud.get_user(db, reg.user_id)
            if user:
                user_emails.append(user.email)
    
    # Send cancellation email
    if user_emails:
        email_service.send_class_cancellation(
            user_emails=user_emails,
            class_date=db_class.date.strftime("%B %d, %Y"),
            package_name=package.name
        )
    
    return {"message": "Class cancelled successfully"}

# QR Code endpoints
@app.post("/api/generate_qr", response_model=schemas.QRGenerateResponse)
def generate_qr_code(request: schemas.QRGenerateRequest, db: Session = Depends(get_db)):
    """Generate QR code for a user"""
    # Find user by name
    user = crud.find_user_by_qr_data(db, request.name)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's active registrations
    registrations = crud.get_active_registrations(db, user.id)
    if not registrations:
        raise HTTPException(status_code=400, detail="No active registrations found")
    
    # Create QR code data (user ID and name)
    qr_data = f"{user.id}:{user.name}"
    
    # Generate QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return schemas.QRGenerateResponse(
        qr_data=qr_data,
        user_info={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "registrations": [{"package_name": reg.package.name} for reg in registrations]
        }
    )

# Attendance endpoints
@app.post("/api/attendance", response_model=schemas.AttendanceScanResponse)
def mark_attendance_from_qr(request: schemas.AttendanceScanRequest, db: Session = Depends(get_db)):
    """Mark attendance from scanned QR code"""
    # Parse QR data (format: "user_id:user_name")
    try:
        user_id_str, user_name = request.qr_data.split(":", 1)
        user_id = int(user_id_str)
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid QR code format")
    
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark attendance with validation
    attendance_record, message, is_registered, registration_message = crud.mark_attendance_with_validation(
        db, request.class_id, user_id, present=True
    )
    
    if not attendance_record:
        return schemas.AttendanceScanResponse(
            success=False,
            message=message,
            user_name=user.name
        )
    
    return schemas.AttendanceScanResponse(
        success=True,
        message=message,
        user_name=user.name,
        already_present=message == "Already marked present",
        is_registered=is_registered,
        registration_message=registration_message
    )

@app.get("/api/attendance/class/{class_id}", response_model=List[schemas.Attendance])
def get_class_attendance(class_id: int, db: Session = Depends(get_db)):
    """Get attendance for a specific class"""
    attendance = crud.get_class_attendance(db, class_id=class_id)
    return attendance

@app.get("/api/attendance/unchecked/{class_id}", response_model=List[schemas.User])
def get_unchecked_students(class_id: int, db: Session = Depends(get_db)):
    """Get all registered students who haven't checked in for a specific class"""
    return crud.get_unchecked_students_for_class(db, class_id)

@app.post("/api/attendance/manual/{class_id}/{user_id}")
def manually_mark_attendance(class_id: int, user_id: int, db: Session = Depends(get_db)):
    """Manually mark attendance for a specific student"""
    attendance_record, message, is_registered, registration_message = crud.mark_attendance_with_validation(
        db, class_id, user_id, present=True
    )
    
    if not attendance_record:
        raise HTTPException(status_code=400, detail=message)
    
    return {
        "success": True,
        "message": message,
        "user_name": crud.get_user(db, user_id).name,
        "is_registered": is_registered,
        "registration_message": registration_message
    }

# Payment endpoints
@app.post("/api/send_invoices")
def generate_and_send_invoices(month: str, db: Session = Depends(get_db)):
    """Generate and send invoices for a specific month"""
    invoices = crud.generate_monthly_invoices(db, month)
    
    # Send invoice emails
    for invoice in invoices:
        user = crud.get_user(db, invoice.user_id)
        if user:
            email_service.send_invoice(
                user_email=user.email,
                user_name=user.name,
                invoice_code=invoice.invoice_code,
                amount_due=invoice.amount_due,
                month=month
            )
    
    return {"message": f"Generated {len(invoices)} invoices for {month}"}

@app.get("/api/payments/user/{user_id}", response_model=List[schemas.Payment])
def get_user_payments(user_id: int, db: Session = Depends(get_db)):
    """Get all payments for a user"""
    payments = crud.get_user_payments(db, user_id=user_id)
    return payments

@app.post("/api/payments/{payment_id}/update")
def update_payment(payment_id: int, amount_paid: float, payment_method: str = None, db: Session = Depends(get_db)):
    """Update payment status (for manual payment matching)"""
    payment = crud.update_payment_status(db, payment_id, amount_paid, payment_method)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment updated successfully"}

# Class Type endpoints
@app.get("/api/class_types", response_model=List[schemas.ClassType])
def get_class_types(db: Session = Depends(get_db)):
    return crud.get_class_types(db)

@app.post("/api/class_types", response_model=schemas.ClassType)
def create_class_type(class_type: schemas.ClassTypeCreate, db: Session = Depends(get_db)):
    return crud.create_class_type(db, class_type)

@app.delete("/api/class_types/{type_id}")
def delete_class_type(type_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_class_type(db, type_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Class type not found")
    return {"message": "Class type deleted"}

# Health check
@app.get("/")
def read_root():
    return {"message": "Tennis Academy MVP API is running"}

@app.post("/api/classes/by_type", response_model=schemas.Class)
def get_or_create_class_by_type(
    date: date = Body(...),
    class_type_id: int = Body(...),
    db: Session = Depends(get_db)
):
    return crud.get_or_create_class_by_date_and_type(db, date, class_type_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
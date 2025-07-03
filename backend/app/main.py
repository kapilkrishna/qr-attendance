from fastapi import FastAPI, Depends, HTTPException, status, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import qrcode
import io
import base64
from datetime import date, datetime
import os
from dotenv import load_dotenv

from . import crud, models, schemas
from .database import SessionLocal, engine

load_dotenv()

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tennis Academy MVP API", version="1.0.0")

# CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://192.168.1.171:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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

# Coach authentication
COACH_PASSWORD = os.getenv("COACH_PASSWORD", "tennis123")  # Use environment variable in production

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
        # Send cancellation email
        pass
    
    return {"message": "Class cancelled successfully"}

# QR Code endpoints
@app.post("/api/generate_qr", response_model=schemas.QRGenerateResponse)
def generate_qr_code(request: schemas.QRGenerateRequest, db: Session = Depends(get_db)):
    try:
        print(f"[DEBUG] QR request for name: {request.name}")
        # Find user by name
        user = crud.find_user_by_qr_data(db, request.name)
        print(f"[DEBUG] User found: {user}")
        if not user:
            print("[DEBUG] User not found")
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"[DEBUG] User ID: {user.id}, Name: {user.name}")
        
        # Get user's active registrations
        registrations = crud.get_active_registrations(db, user.id)
        print(f"[DEBUG] Active registrations count: {len(registrations) if registrations else 0}")
        if not registrations:
            print("[DEBUG] No active registrations found")
            raise HTTPException(status_code=400, detail="No active registrations found")
        
        # Validate registrations and packages
        valid_registrations = []
        for reg in registrations:
            if reg and reg.package and hasattr(reg.package, 'name'):
                valid_registrations.append(reg)
            else:
                print(f"[DEBUG] Invalid registration or package: {reg}")
        
        if not valid_registrations:
            print("[DEBUG] No valid registrations found")
            raise HTTPException(status_code=400, detail="No valid registrations found")
        
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
        
        print("[DEBUG] QR code generated successfully")
        return schemas.QRGenerateResponse(
            qr_data=qr_data,
            user_info={
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "registrations": [{"package_name": reg.package.name} for reg in valid_registrations]
            }
        )
    except Exception as e:
        print(f"[ERROR] QR generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"QR generation failed: {str(e)}")

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
    
    # Validate status
    if request.status not in ["present", "late"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'present' or 'late'")
    
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark attendance with validation using the provided status
    attendance_record, message, is_registered, registration_message = crud.mark_attendance_with_validation(
        db, request.class_id, user_id, status=request.status
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
        db, class_id, user_id, status="present"
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

@app.put("/api/attendance/{class_id}/{user_id}/status")
def update_attendance_status_endpoint(class_id: int, user_id: int, status: str, db: Session = Depends(get_db)):
    """Update attendance status for a specific student"""
    if status not in ["present", "late", "missing"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'present', 'late', or 'missing'")
    
    attendance_record = crud.update_attendance_status(db, class_id, user_id, status)
    if not attendance_record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    user = crud.get_user(db, user_id)
    return {
        "success": True,
        "message": f"Attendance status updated to {status}",
        "user_name": user.name,
        "status": status
    }

@app.get("/api/attendance/comprehensive/{class_id}")
def get_comprehensive_attendance(class_id: int, db: Session = Depends(get_db)):
    """Get comprehensive attendance data for a class"""
    attendance_data = crud.get_comprehensive_attendance_for_class(db, class_id)
    return attendance_data

@app.post("/api/attendance/add_user/{class_id}")
def add_user_to_attendance(class_id: int, request: dict, db: Session = Depends(get_db)):
    """Add a new user and mark their attendance"""
    name = request.get("name")
    email = request.get("email")
    status = request.get("status", "present")
    
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    if status not in ["present", "late", "missing"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'present', 'late', or 'missing'")
    
    # Create or get user
    user = crud.create_user_for_attendance(db, name, email)
    
    # Mark attendance
    attendance_record = crud.update_attendance_status(db, class_id, user.id, status)
    
    return {
        "success": True,
        "message": f"User {name} added and marked as {status}",
        "user_name": user.name,
        "user_id": user.id,
        "status": status,
        "is_registered": False
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
            # Send invoice email
            pass
    
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

@app.delete("/api/attendance/{class_id}/{user_id}")
def delete_attendance(class_id: int, user_id: int, db: Session = Depends(get_db)):
    """Uncheck attendance for a specific student in a class (delete attendance record)"""
    deleted = crud.delete_attendance_record(db, class_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return {"success": True, "message": "Attendance record deleted (unchecked)"}

# Debug endpoint to check user registrations
@app.get("/api/debug/user/{name}")
def debug_user_registrations(name: str, db: Session = Depends(get_db)):
    """Debug endpoint to check user and their registrations"""
    try:
        print(f"[DEBUG] Checking user: {name}")
        
        # Find user by name
        user = crud.find_user_by_qr_data(db, name)
        if not user:
            return {"error": "User not found", "name": name}
        
        print(f"[DEBUG] User found: {user.id} - {user.name}")
        
        # Get all registrations (not just active)
        all_registrations = crud.get_user_registrations(db, user.id)
        print(f"[DEBUG] All registrations: {len(all_registrations)}")
        
        # Get active registrations
        active_registrations = crud.get_active_registrations(db, user.id)
        print(f"[DEBUG] Active registrations: {len(active_registrations)}")
        
        # Format registration data
        reg_data = []
        for reg in all_registrations:
            reg_info = {
                "id": reg.id,
                "status": reg.status,
                "start_date": str(reg.start_date),
                "end_date": str(reg.end_date),
                "package_id": reg.package_id,
                "package_name": reg.package.name if reg.package else "NO PACKAGE",
                "package_class_type": reg.package.class_type.name if reg.package and reg.package.class_type else "NO CLASS TYPE"
            }
            reg_data.append(reg_info)
        
        return {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            },
            "all_registrations": reg_data,
            "active_registrations_count": len(active_registrations),
            "today": str(date.today())
        }
        
    except Exception as e:
        print(f"[ERROR] Debug error: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
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

from . import crud, models_simple as models, schemas, seed_data
from .database import SessionLocal, engine

load_dotenv()

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tennis Academy MVP API", version="1.0.0")

# CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5174,https://localhost:5173,https://localhost:5174,http://192.168.1.171:5173,https://192.168.1.171:5173,http://192.168.1.171:5174,https://192.168.1.171:5174").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.1\.171)(:\d+)?",
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
@app.post("/api/users")
def create_user(name: str, email: str, role: str = "student", db: Session = Depends(get_db)):
    return crud.create_user(db, name, email, role)

@app.get("/api/users")
def list_users(db: Session = Depends(get_db)):
    return crud.get_users(db)

@app.get("/api/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Package endpoints
@app.post("/api/packages")
def create_package(name: str, description: str, price: float, start_date: date, end_date: date, class_days: str, db: Session = Depends(get_db)):
    return crud.create_package(db, name, description, price, start_date, end_date, class_days)

@app.get("/api/packages")
def list_packages(db: Session = Depends(get_db)):
    return crud.get_packages(db)

@app.get("/api/packages/{package_id}")
def get_package(package_id: int, db: Session = Depends(get_db)):
    package = crud.get_package(db, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package

# Class endpoints
@app.post("/api/classes")
def create_class(package_id: int, date: date, time: str, location: str, active: bool = True, db: Session = Depends(get_db)):
    return crud.create_class(db, package_id, date, time, location, active)

@app.get("/api/classes")
def list_classes(db: Session = Depends(get_db)):
    return crud.get_classes(db)

@app.get("/api/classes/{class_id}")
def get_class(class_id: int, db: Session = Depends(get_db)):
    class_obj = crud.get_class(db, class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    return class_obj

# Attendance endpoints
@app.get("/api/attendance/{class_id}")
def get_attendance(class_id: int, db: Session = Depends(get_db)):
    return crud.get_attendance(db, class_id)

@app.post("/api/attendance/mark")
def mark_attendance(class_id: int, user_id: int, status: str = "present", db: Session = Depends(get_db)):
    return crud.mark_attendance(db, class_id, user_id, status)

# QR Code endpoints
@app.post("/api/generate_qr", response_model=schemas.QRGenerateResponse)
def generate_qr_code(request: schemas.QRGenerateRequest, db: Session = Depends(get_db)):
    try:
        print(f"[DEBUG] QR request for name: {request.name}")
        
        # Find user by name - try exact match first
        user = crud.find_user_by_qr_data(db, request.name)
        
        # If not found, try case-insensitive search
        if not user:
            print(f"[DEBUG] Exact match not found, trying case-insensitive search")
            from sqlalchemy import func
            user = db.query(models.User).filter(
                func.lower(models.User.name) == func.lower(request.name)
            ).first()
        
        # If still not found, create a new user
        if not user:
            print(f"[DEBUG] User not found, creating new user for name: {request.name}")
            user = crud.create_user_for_attendance(db, request.name)
        
        print(f"[DEBUG] User found or created: {user}")
        print(f"[DEBUG] User ID: {user.id}, Name: {user.name}")
        
        # Get user's active registrations (optional)
        registrations = crud.get_active_registrations(db, user.id)
        print(f"[DEBUG] Active registrations count: {len(registrations) if registrations else 0}")
        valid_registrations = []
        if registrations:
            for reg in registrations:
                if reg and reg.package and hasattr(reg.package, 'name'):
                    valid_registrations.append(reg)
                else:
                    print(f"[DEBUG] Invalid registration or package: {reg}")
        # No longer require valid_registrations to proceed
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
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] QR generation failed with exception: {str(e)}")
        print(f"[ERROR] Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"QR generation failed: {str(e)}")

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

# Seed database endpoint
@app.post("/api/seed")
def seed_database_endpoint(db: Session = Depends(get_db)):
    """Seed the database with test data"""
    try:
        seed_data.seed_database(db)
        return {"message": "Database seeded successfully"}
    except Exception as e:
        print(f"[ERROR] Seeding error: {str(e)}")
        return {"error": str(e)}

# Database cleanup endpoint
@app.post("/api/cleanup")
def cleanup_database(db: Session = Depends(get_db)):
    """Clean up database inconsistencies"""
    try:
        print("[DEBUG] Starting database cleanup...")
        
        # Find registrations with invalid package references
        invalid_registrations = db.query(models.Registration).outerjoin(models.Package).filter(
            models.Package.id.is_(None)
        ).all()
        
        print(f"[DEBUG] Found {len(invalid_registrations)} registrations with invalid packages")
        
        # Delete invalid registrations
        for reg in invalid_registrations:
            print(f"[DEBUG] Deleting invalid registration {reg.id}")
            db.delete(reg)
        
        db.commit()
        
        return {
            "message": f"Database cleanup completed. Removed {len(invalid_registrations)} invalid registrations.",
            "removed_count": len(invalid_registrations)
        }
        
    except Exception as e:
        print(f"[ERROR] Cleanup error: {str(e)}")
        import traceback
        print(f"[ERROR] Full traceback: {traceback.format_exc()}")
        return {"error": str(e)}

# Database reset endpoint
@app.post("/api/reset_database")
def reset_database(db: Session = Depends(get_db)):
    """Reset entire database - removes all users, registrations, attendance, etc."""
    try:
        print("[DEBUG] Starting complete database reset...")
        
        # Delete all attendance records
        attendance_count = db.query(models.Attendance).count()
        db.query(models.Attendance).delete()
        print(f"[DEBUG] Deleted {attendance_count} attendance records")
        
        # Delete all registrations
        registration_count = db.query(models.Registration).count()
        db.query(models.Registration).delete()
        print(f"[DEBUG] Deleted {registration_count} registrations")
        
        # Delete all users
        user_count = db.query(models.User).count()
        db.query(models.User).delete()
        print(f"[DEBUG] Deleted {user_count} users")
        
        # Delete all payments
        payment_count = db.query(models.Payment).count()
        db.query(models.Payment).delete()
        print(f"[DEBUG] Deleted {payment_count} payments")
        
        # Keep packages, classes, and class types (these are the core data)
        print("[DEBUG] Keeping packages, classes, and class types")
        
        db.commit()
        
        total_deleted = attendance_count + registration_count + user_count + payment_count
        return {
            "message": f"Database reset completed. Removed {total_deleted} records.",
            "details": {
                "attendance_records": attendance_count,
                "registrations": registration_count,
                "users": user_count,
                "payments": payment_count
            }
        }
    except Exception as e:
        db.rollback()
        print(f"[DEBUG] Reset failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database reset failed: {str(e)}")

# User merge endpoint
@app.post("/api/merge_users")
def merge_users(request: dict, db: Session = Depends(get_db)):
    """Merge users with different emails but same name"""
    try:
        name = request.get("name")
        primary_email = request.get("primary_email")
        secondary_email = request.get("secondary_email")
        
        if not all([name, primary_email, secondary_email]):
            raise HTTPException(status_code=400, detail="Missing required fields: name, primary_email, secondary_email")
        
        # Find both users
        primary_user = crud.get_user_by_email(db, primary_email)
        secondary_user = crud.get_user_by_email(db, secondary_email)
        
        if not primary_user or not secondary_user:
            raise HTTPException(status_code=404, detail="One or both users not found")
        
        if primary_user.name != secondary_user.name:
            raise HTTPException(status_code=400, detail="Users must have the same name to merge")
        
        print(f"[DEBUG] Merging users: {primary_user.name} ({primary_email}) and {secondary_user.name} ({secondary_email})")
        
        # Move all registrations from secondary to primary user
        secondary_registrations = crud.get_user_registrations(db, secondary_user.id)
        for reg in secondary_registrations:
            reg.user_id = primary_user.id
            print(f"[DEBUG] Moved registration {reg.id} to user {primary_user.id}")
        
        # Move all attendance records from secondary to primary user
        secondary_attendance = db.query(models.Attendance).filter(
            models.Attendance.user_id == secondary_user.id
        ).all()
        for att in secondary_attendance:
            att.user_id = primary_user.id
            print(f"[DEBUG] Moved attendance {att.id} to user {primary_user.id}")
        
        # Move all payments from secondary to primary user
        secondary_payments = db.query(models.Payment).filter(
            models.Payment.user_id == secondary_user.id
        ).all()
        for payment in secondary_payments:
            payment.user_id = primary_user.id
            print(f"[DEBUG] Moved payment {payment.id} to user {primary_user.id}")
        
        # Delete the secondary user
        db.delete(secondary_user)
        print(f"[DEBUG] Deleted secondary user {secondary_user.id}")
        
        db.commit()
        
        return {
            "message": f"Successfully merged users. Primary user: {primary_user.name} ({primary_email})",
            "primary_user_id": primary_user.id,
            "moved_registrations": len(secondary_registrations),
            "moved_attendance": len(secondary_attendance),
            "moved_payments": len(secondary_payments)
        }
    except Exception as e:
        db.rollback()
        print(f"[DEBUG] Merge failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"User merge failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
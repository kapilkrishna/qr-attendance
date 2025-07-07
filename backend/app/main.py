from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import qrcode
import io
import base64
from datetime import date, datetime, time
import os
from dotenv import load_dotenv

from . import crud, models, schemas
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
COACH_PASSWORD = os.getenv("COACH_PASSWORD", "tennis123")

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
def create_package(name: str, description: str, price: float, start_date: date, end_date: date, db: Session = Depends(get_db)):
    return crud.create_package(db, name, description, price, start_date, end_date)

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
def create_class(package_id: int, date: date, start_time: str, end_time: str, location: str, db: Session = Depends(get_db)):
    # Convert time strings to time objects
    start_time_obj = datetime.strptime(start_time, "%H:%M").time()
    end_time_obj = datetime.strptime(end_time, "%H:%M").time()
    return crud.create_class(db, package_id, date, start_time_obj, end_time_obj, location)

@app.get("/api/classes")
def list_classes(db: Session = Depends(get_db)):
    return crud.get_classes(db)

@app.get("/api/classes/{class_id}")
def get_class(class_id: int, db: Session = Depends(get_db)):
    class_obj = crud.get_class(db, class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    return class_obj

@app.post("/api/classes/{class_id}/cancel")
def cancel_class(class_id: int, db: Session = Depends(get_db)):
    class_obj = crud.cancel_class(db, class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"message": "Class cancelled successfully"}

# Attendance endpoints
@app.get("/api/attendance/{class_id}")
def get_attendance(class_id: int, db: Session = Depends(get_db)):
    return crud.get_attendance(db, class_id)

@app.post("/api/attendance/mark")
def mark_attendance(class_id: int, user_id: int, status: str = "present", db: Session = Depends(get_db)):
    return crud.mark_attendance(db, class_id, user_id, status)

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
    
    # Create user if they don't exist
    user = crud.find_user_by_qr_data(db, name)
    if not user:
        user = crud.create_user_for_attendance(db, name, email)
    
    # Mark attendance
    attendance = crud.mark_attendance(db, class_id, user.id, status)
    
    return {
        "message": "User added and attendance marked",
        "user": user,
        "attendance": attendance
    }

@app.delete("/api/attendance/{class_id}/{user_id}")
def delete_attendance(class_id: int, user_id: int, db: Session = Depends(get_db)):
    """Delete attendance record for a user in a class"""
    success = crud.delete_attendance_record(db, class_id, user_id)
    if success:
        return {"message": "Attendance record deleted"}
    else:
        raise HTTPException(status_code=404, detail="Attendance record not found")

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
                "registrations": []  # No registrations in simplified schema
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] QR generation failed with exception: {str(e)}")
        print(f"[ERROR] Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"QR generation failed: {str(e)}")

@app.post("/api/attendance/scan", response_model=schemas.AttendanceScanResponse)
def scan_attendance(request: schemas.AttendanceScanRequest, db: Session = Depends(get_db)):
    """Scan QR code and mark attendance"""
    try:
        # Parse QR data (format: "user_id:user_name")
        qr_parts = request.qr_data.split(":", 1)
        if len(qr_parts) != 2:
            raise HTTPException(status_code=400, detail="Invalid QR code format")
        
        user_id = int(qr_parts[0])
        user_name = qr_parts[1]
        
        # Verify user exists
        user = crud.get_user(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if already marked present
        existing_attendance = db.query(models.Attendance).filter(
            models.Attendance.class_id == request.class_id,
            models.Attendance.user_id == user_id
        ).first()
        
        if existing_attendance and existing_attendance.status in ["present", "late"]:
            return schemas.AttendanceScanResponse(
                success=False,
                message=f"Already marked {existing_attendance.status}",
                user_name=user.name,
                already_present=True
            )
        
        # Mark attendance
        attendance = crud.mark_attendance(db, request.class_id, user_id, request.status)
        
        return schemas.AttendanceScanResponse(
            success=True,
            message="Attendance marked successfully",
            user_name=user.name,
            already_present=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Attendance scan failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Attendance scan failed: {str(e)}")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Tennis Academy MVP API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
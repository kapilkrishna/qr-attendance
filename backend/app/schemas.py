from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime, time

# User schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

# Package schemas
class PackageBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    start_date: date
    end_date: date

class PackageCreate(PackageBase):
    pass

class Package(PackageBase):
    id: int
    
    class Config:
        from_attributes = True

# Class schemas
class ClassBase(BaseModel):
    package_id: int
    date: date
    start_time: time
    end_time: time
    location: str
    cancelled: bool = False

class ClassCreate(ClassBase):
    pass

class Class(ClassBase):
    id: int
    
    class Config:
        from_attributes = True

# Attendance schemas
class AttendanceBase(BaseModel):
    class_id: int
    user_id: int
    status: str = "present"  # present, late, missing

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    id: int
    checked_in_at: datetime
    
    class Config:
        from_attributes = True

# QR Code schemas
class QRGenerateRequest(BaseModel):
    name: str

class QRGenerateResponse(BaseModel):
    qr_data: str
    user_info: dict

# Attendance scan schemas
class AttendanceScanRequest(BaseModel):
    qr_data: str
    class_id: int
    status: str = "present"  # Default to present, can be "present" or "late"

class AttendanceScanResponse(BaseModel):
    success: bool
    message: str
    user_name: Optional[str] = None
    already_present: bool = False

# Coach authentication
class CoachAuthRequest(BaseModel):
    password: str

class CoachAuthResponse(BaseModel):
    authenticated: bool
    message: str 
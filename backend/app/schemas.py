from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

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
    duration_type: str
    num_classes: Optional[int] = None
    num_weeks: Optional[int] = None

class PackageCreate(PackageBase):
    pass

class PackageOptionBase(BaseModel):
    label: str
    start_date: date
    end_date: date

class PackageOptionCreate(PackageOptionBase):
    pass

class PackageOption(PackageOptionBase):
    id: int
    class Config:
        from_attributes = True

class Package(PackageBase):
    id: int
    options: Optional[List[PackageOption]] = []
    
    class Config:
        from_attributes = True

# Registration schemas
class RegistrationBase(BaseModel):
    user_id: int
    package_id: int
    start_date: date
    end_date: date
    status: str = "active"

class RegistrationCreate(RegistrationBase):
    pass

class Registration(RegistrationBase):
    id: int
    
    class Config:
        from_attributes = True

# Class schemas
class ClassBase(BaseModel):
    date: date
    package_id: int | None = None
    class_type_id: int
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
    present: bool = False

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    id: int
    checked_in_at: datetime
    
    class Config:
        from_attributes = True

# Payment schemas
class PaymentBase(BaseModel):
    user_id: int
    month: str
    invoice_code: str
    amount_due: float
    amount_paid: float = 0
    paid: bool = False
    payment_method: Optional[str] = None
    payment_date: Optional[date] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    created_at: datetime
    
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

class AttendanceScanResponse(BaseModel):
    success: bool
    message: str
    user_name: Optional[str] = None
    already_present: bool = False
    is_registered: Optional[bool] = None
    registration_message: Optional[str] = None

# Coach authentication
class CoachAuthRequest(BaseModel):
    password: str

class CoachAuthResponse(BaseModel):
    authenticated: bool
    message: str

# ClassType schemas
class ClassTypeBase(BaseModel):
    name: str

class ClassTypeCreate(ClassTypeBase):
    pass

class ClassType(ClassTypeBase):
    id: int
    class Config:
        from_attributes = True 
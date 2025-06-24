from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    role = Column(String, nullable=False)  # student, parent, coach
    
    # Relationships
    registrations = relationship("Registration", back_populates="user")
    attendance_records = relationship("Attendance", back_populates="user")
    payments = relationship("Payment", back_populates="user")

class Package(Base):
    __tablename__ = "packages"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    duration_type = Column(String, nullable=False)  # class, week
    num_classes = Column(Integer, nullable=True)
    num_weeks = Column(Integer, nullable=True)
    
    # Relationships
    registrations = relationship("Registration", back_populates="package", cascade="all, delete-orphan")
    classes = relationship("Class", back_populates="package", cascade="all, delete-orphan")
    options = relationship("PackageOption", back_populates="package", cascade="all, delete-orphan")

class Registration(Base):
    __tablename__ = "registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="active")  # active, cancelled, completed
    
    # Relationships
    user = relationship("User", back_populates="registrations")
    package = relationship("Package", back_populates="registrations")

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    cancelled = Column(Boolean, default=False)
    
    # Relationships
    package = relationship("Package", back_populates="classes")
    attendance_records = relationship("Attendance", back_populates="class_record")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    present = Column(Boolean, default=False)
    checked_in_at = Column(DateTime, default=func.now())
    
    # Relationships
    class_record = relationship("Class", back_populates="attendance_records")
    user = relationship("User", back_populates="attendance_records")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    month = Column(String, nullable=False)  # e.g., "2024-07"
    invoice_code = Column(String, unique=True, nullable=False)
    amount_due = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0)
    paid = Column(Boolean, default=False)
    payment_method = Column(String, nullable=True)
    payment_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="payments")

class PackageOption(Base):
    __tablename__ = "package_options"
    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    label = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    package = relationship("Package", back_populates="options")

class ClassType(Base):
    __tablename__ = "class_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    # Optionally, add description or color fields 
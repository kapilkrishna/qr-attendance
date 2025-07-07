from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, DateTime, Time
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
    attendance_records = relationship("Attendance", back_populates="user")

class Package(Base):
    __tablename__ = "packages"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Relationships
    classes = relationship("Class", back_populates="package", cascade="all, delete-orphan")

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    location = Column(String, nullable=False)
    cancelled = Column(Boolean, default=False)
    
    # Relationships
    package = relationship("Package", back_populates="classes")
    attendance_records = relationship("Attendance", back_populates="class_record")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="present")  # present, late, missing
    checked_in_at = Column(DateTime, default=func.now())
    
    # Relationships
    class_record = relationship("Class", back_populates="attendance_records")
    user = relationship("User", back_populates="attendance_records") 
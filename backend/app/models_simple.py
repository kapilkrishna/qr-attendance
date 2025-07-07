from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, default="student")  # student, coach
    
    # Relationships
    attendance_records = relationship("Attendance", back_populates="user")

class Package(Base):
    __tablename__ = "packages"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # "Elite Summer 2025"
    description = Column(String)
    price = Column(Float, default=0)
    start_date = Column(Date, nullable=False)  # "2025-06-16"
    end_date = Column(Date, nullable=False)    # "2025-08-15"
    class_days = Column(String, nullable=False)  # "Monday,Tuesday,Wednesday"
    
    # Relationships
    classes = relationship("Class", back_populates="package")

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    date = Column(Date, nullable=False)
    time = Column(String, nullable=False)  # "1:00 PM"
    location = Column(String, nullable=False)  # "Holmes Middle School"
    active = Column(Boolean, default=True)
    
    # Relationships
    package = relationship("Package", back_populates="classes")
    attendance_records = relationship("Attendance", back_populates="class_record")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="present")  # present, late, absent
    checked_in_at = Column(DateTime, default=func.now())
    
    # Relationships
    class_record = relationship("Class", back_populates="attendance_records")
    user = relationship("User", back_populates="attendance_records") 
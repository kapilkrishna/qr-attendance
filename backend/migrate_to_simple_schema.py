#!/usr/bin/env python3
"""
Create new tables for the simplified schema (no migration from old tables).
"""

import sys
import os
from sqlalchemy import create_engine

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import Base
from app.models_simple import User, Package, Class, Attendance

def create_simple_schema():
    """Create new tables for the simplified schema."""
    engine = create_engine("sqlite:///./tennis_academy.db")
    Base.metadata.create_all(bind=engine)
    print("Simplified schema tables created successfully!")

if __name__ == "__main__":
    create_simple_schema() 
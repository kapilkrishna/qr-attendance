#!/usr/bin/env python3
"""
Tennis Academy MVP - Monthly Invoice Generator
Run this script to generate and send invoices for a specific month
"""

import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.main import generate_and_send_invoices

load_dotenv()

def main():
    """Generate invoices for a specific month"""
    
    # Get month from command line argument or use current month
    if len(sys.argv) > 1:
        month = sys.argv[1]
    else:
        # Default to current month
        month = datetime.now().strftime("%Y-%m")
    
    print(f"🎾 Tennis Academy MVP - Invoice Generator")
    print(f"Generating invoices for: {month}")
    print("=" * 50)
    
    try:
        # Create database session
        db = SessionLocal()
        
        # Generate invoices
        result = generate_and_send_invoices(month, db)
        
        print(f"✅ Successfully generated invoices!")
        print(f"📧 {result['message']}")
        
    except Exception as e:
        print(f"❌ Error generating invoices: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main() 
#!/usr/bin/env python3
"""
Tennis Academy MVP - Payment Matching Script
Match payments from Zelle/Venmo CSV exports with invoice codes
"""

import csv
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.crud import get_payment_by_invoice_code, update_payment_status

load_dotenv()

def match_payments_from_csv(csv_file_path):
    """Match payments from CSV file with invoice codes"""
    
    print(f"🎾 Tennis Academy MVP - Payment Matcher")
    print(f"Processing CSV file: {csv_file_path}")
    print("=" * 50)
    
    db = SessionLocal()
    
    try:
        matched_count = 0
        unmatched_count = 0
        
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                # Extract payment information from CSV
                # Adjust these field names based on your CSV format
                amount = float(row.get('Amount', 0))
                subject = row.get('Subject', '').strip()
                date_str = row.get('Date', '')
                payment_method = row.get('Payment Method', 'Zelle/Venmo')
                
                # Look for invoice code in subject line
                # Invoice codes are in format: INV-YYYYMMDD-XXXXXXXX
                import re
                invoice_match = re.search(r'INV-\d{8}-[A-Z0-9]{8}', subject)
                
                if invoice_match:
                    invoice_code = invoice_match.group()
                    
                    # Find payment in database
                    payment = get_payment_by_invoice_code(db, invoice_code)
                    
                    if payment:
                        # Update payment status
                        update_payment_status(db, payment.id, amount, payment_method)
                        print(f"✅ Matched: {invoice_code} - ${amount}")
                        matched_count += 1
                    else:
                        print(f"❌ Invoice not found: {invoice_code}")
                        unmatched_count += 1
                else:
                    print(f"⚠️  No invoice code found in: {subject}")
                    unmatched_count += 1
        
        print("=" * 50)
        print(f"✅ Processing complete!")
        print(f"📊 Matched: {matched_count}")
        print(f"❌ Unmatched: {unmatched_count}")
        
    except FileNotFoundError:
        print(f"❌ CSV file not found: {csv_file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error processing payments: {e}")
        sys.exit(1)
    finally:
        db.close()

def main():
    """Main function"""
    
    if len(sys.argv) < 2:
        print("Usage: python match_payments.py <csv_file_path>")
        print("")
        print("CSV file should contain columns:")
        print("- Amount: Payment amount")
        print("- Subject: Payment subject (should contain invoice code)")
        print("- Date: Payment date")
        print("- Payment Method: Method of payment")
        print("")
        print("Example:")
        print("python match_payments.py payments_export.csv")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    match_payments_from_csv(csv_file_path)

if __name__ == "__main__":
    main() 
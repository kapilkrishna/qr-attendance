from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from datetime import date, datetime
import json

def export_data():
    """Export all data from local database to JSON"""
    db = SessionLocal()
    
    try:
        # Export class types
        class_types = []
        for ct in db.query(models.ClassType).all():
            class_types.append({
                "name": ct.name
            })
        
        # Export packages
        packages = []
        for pkg in db.query(models.Package).all():
            packages.append({
                "name": pkg.name,
                "description": pkg.description,
                "price": float(pkg.price),
                "duration_type": pkg.duration_type,
                "num_classes": pkg.num_classes,
                "num_weeks": pkg.num_weeks,
                "class_type_id": pkg.class_type_id
            })
        
        # Export users
        users = []
        for user in db.query(models.User).all():
            users.append({
                "name": user.name,
                "email": user.email,
                "role": user.role
            })
        
        # Export registrations
        registrations = []
        for reg in db.query(models.Registration).all():
            registrations.append({
                "user_id": reg.user_id,
                "package_id": reg.package_id,
                "start_date": reg.start_date.isoformat(),
                "end_date": reg.end_date.isoformat(),
                "status": reg.status
            })
        
        # Export classes
        classes = []
        for cls in db.query(models.Class).all():
            classes.append({
                "date": cls.date.isoformat(),
                "package_id": cls.package_id,
                "class_type_id": cls.class_type_id,
                "cancelled": cls.cancelled
            })
        
        # Export attendance
        attendance = []
        for att in db.query(models.Attendance).all():
            attendance.append({
                "class_id": att.class_id,
                "user_id": att.user_id,
                "status": att.status,
                "checked_in_at": att.checked_in_at.isoformat() if att.checked_in_at else None
            })
        
        # Export payments
        payments = []
        for payment in db.query(models.Payment).all():
            payments.append({
                "user_id": payment.user_id,
                "month": payment.month,
                "invoice_code": payment.invoice_code,
                "amount_due": float(payment.amount_due),
                "amount_paid": float(payment.amount_paid),
                "paid": payment.paid,
                "payment_method": payment.payment_method,
                "payment_date": payment.payment_date.isoformat() if payment.payment_date else None
            })
        
        # Export package options
        package_options = []
        for opt in db.query(models.PackageOption).all():
            package_options.append({
                "package_id": opt.package_id,
                "label": opt.label,
                "start_date": opt.start_date.isoformat(),
                "end_date": opt.end_date.isoformat()
            })
        
        # Create complete export
        export_data = {
            "class_types": class_types,
            "packages": packages,
            "users": users,
            "registrations": registrations,
            "classes": classes,
            "attendance": attendance,
            "payments": payments,
            "package_options": package_options
        }
        
        # Save to file
        with open('local_data_export.json', 'w') as f:
            json.dump(export_data, f, indent=2)
        
        print("=== EXPORT SUMMARY ===")
        print(f"Class Types: {len(class_types)}")
        print(f"Packages: {len(packages)}")
        print(f"Users: {len(users)}")
        print(f"Registrations: {len(registrations)}")
        print(f"Classes: {len(classes)}")
        print(f"Attendance: {len(attendance)}")
        print(f"Payments: {len(payments)}")
        print(f"Package Options: {len(package_options)}")
        print("\nData exported to: local_data_export.json")
        
    finally:
        db.close()

if __name__ == "__main__":
    export_data() 
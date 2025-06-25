#!/usr/bin/env python3
"""
Migration script to update attendance table from boolean 'present' to string 'status'
"""
import sqlite3
import os

def migrate_attendance_table():
    """Migrate the attendance table to use status field instead of present field"""
    
    # Connect to the database
    db_path = "tennis_academy.db"
    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found. Creating new database...")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if the present column exists
        cursor.execute("PRAGMA table_info(attendance)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'present' in columns and 'status' not in columns:
            print("Migrating attendance table...")
            
            # Add the new status column
            cursor.execute("ALTER TABLE attendance ADD COLUMN status TEXT DEFAULT 'present'")
            
            # Update existing records: present=True -> status='present', present=False -> status='missing'
            cursor.execute("UPDATE attendance SET status = 'present' WHERE present = 1")
            cursor.execute("UPDATE attendance SET status = 'missing' WHERE present = 0")
            
            # Remove the old present column (SQLite doesn't support DROP COLUMN directly)
            # We'll create a new table with the correct schema
            cursor.execute("""
                CREATE TABLE attendance_new (
                    id INTEGER PRIMARY KEY,
                    class_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    status TEXT DEFAULT 'present',
                    checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (class_id) REFERENCES classes (id),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            
            # Copy data to new table
            cursor.execute("""
                INSERT INTO attendance_new (id, class_id, user_id, status, checked_in_at)
                SELECT id, class_id, user_id, status, checked_in_at FROM attendance
            """)
            
            # Drop old table and rename new table
            cursor.execute("DROP TABLE attendance")
            cursor.execute("ALTER TABLE attendance_new RENAME TO attendance")
            
            print("Migration completed successfully!")
            
        elif 'status' in columns:
            print("Database already migrated (status column exists)")
        else:
            print("No present column found. Database may be empty or have different schema.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.commit()
        conn.close()

if __name__ == "__main__":
    migrate_attendance_table() 
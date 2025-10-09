#!/usr/bin/env python3
"""
Fix assessment_result table schema by adding missing columns
"""

import sqlite3
import os

# Get the database path
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'ai_literacy.db')

print(f"🔧 Fixing assessment_result table schema...")
print(f"📁 Database: {db_path}")

try:
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current schema
    cursor.execute("PRAGMA table_info(assessment_result)")
    columns = cursor.fetchall()
    existing_columns = [col[1] for col in columns]
    
    print(f"\n📊 Current columns: {', '.join(existing_columns)}")
    
    # Add domain_scores column if it doesn't exist
    if 'domain_scores' not in existing_columns:
        print("\n➕ Adding 'domain_scores' column...")
        cursor.execute("""
            ALTER TABLE assessment_result 
            ADD COLUMN domain_scores TEXT
        """)
        print("✅ Added 'domain_scores' column")
    else:
        print("\n✅ Column 'domain_scores' already exists")
    
    # Add time_taken_minutes column if it doesn't exist
    if 'time_taken_minutes' not in existing_columns:
        print("\n➕ Adding 'time_taken_minutes' column...")
        cursor.execute("""
            ALTER TABLE assessment_result 
            ADD COLUMN time_taken_minutes INTEGER DEFAULT 0
        """)
        print("✅ Added 'time_taken_minutes' column")
    else:
        print("\n✅ Column 'time_taken_minutes' already exists")
    
    # Add recommendations column if it doesn't exist
    if 'recommendations' not in existing_columns:
        print("\n➕ Adding 'recommendations' column...")
        cursor.execute("""
            ALTER TABLE assessment_result 
            ADD COLUMN recommendations TEXT
        """)
        print("✅ Added 'recommendations' column")
    else:
        print("\n✅ Column 'recommendations' already exists")
    
    # Commit changes
    conn.commit()
    
    # Verify the changes
    cursor.execute("PRAGMA table_info(assessment_result)")
    columns = cursor.fetchall()
    new_columns = [col[1] for col in columns]
    
    print(f"\n📊 Updated columns: {', '.join(new_columns)}")
    
    conn.close()
    
    print("\n✅ Schema migration complete!")
    print("\n📝 Next step: Restart the backend server")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    exit(1)


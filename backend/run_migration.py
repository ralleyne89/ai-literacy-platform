#!/usr/bin/env python3
"""
Simple migration runner
"""

import sqlite3
import os

# Get database path
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'ai_literacy.db')

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if column exists
    cursor.execute("PRAGMA table_info(training_module)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'target_domains' in columns:
        print("✅ Column 'target_domains' already exists in training_module table")
    else:
        # Add the column
        cursor.execute("ALTER TABLE training_module ADD COLUMN target_domains TEXT")
        conn.commit()
        print("✅ Successfully added 'target_domains' column to training_module table")
    
except Exception as e:
    print(f"❌ Migration failed: {e}")
    conn.rollback()
    raise
finally:
    conn.close()

print("\n✅ Migration complete! Now run: flask seed-training-modules --force")


#!/usr/bin/env python3
"""
Migration: Add course content tables (Lesson and LessonProgress)
"""

import sqlite3
import os

# Get the database path
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'ai_literacy.db')

print(f"🔧 Adding course content tables...")
print(f"📁 Database: {db_path}")

try:
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create Lesson table
    print("\n➕ Creating 'lesson' table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lesson (
            id TEXT PRIMARY KEY,
            module_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            order_index INTEGER NOT NULL,
            content_type TEXT NOT NULL,
            content TEXT,
            estimated_duration_minutes INTEGER DEFAULT 10,
            is_required BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (module_id) REFERENCES training_module(id)
        )
    """)
    print("✅ Created 'lesson' table")
    
    # Create LessonProgress table
    print("\n➕ Creating 'lesson_progress' table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lesson_progress (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            lesson_id TEXT NOT NULL,
            module_id TEXT NOT NULL,
            status TEXT DEFAULT 'not_started',
            time_spent_minutes INTEGER DEFAULT 0,
            quiz_score INTEGER,
            quiz_attempts INTEGER DEFAULT 0,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(id),
            FOREIGN KEY (lesson_id) REFERENCES lesson(id),
            FOREIGN KEY (module_id) REFERENCES training_module(id),
            UNIQUE(user_id, lesson_id)
        )
    """)
    print("✅ Created 'lesson_progress' table")
    
    # Add current_lesson_id column to user_progress table if it doesn't exist
    print("\n➕ Adding 'current_lesson_id' column to 'user_progress' table...")
    cursor.execute("PRAGMA table_info(user_progress)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'current_lesson_id' not in columns:
        cursor.execute("""
            ALTER TABLE user_progress 
            ADD COLUMN current_lesson_id TEXT
        """)
        print("✅ Added 'current_lesson_id' column")
    else:
        print("✅ Column 'current_lesson_id' already exists")
    
    # Create indexes for better performance
    print("\n➕ Creating indexes...")
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_lesson_module_id 
        ON lesson(module_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id 
        ON lesson_progress(user_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id 
        ON lesson_progress(lesson_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_lesson_progress_module_id 
        ON lesson_progress(module_id)
    """)
    print("✅ Created indexes")
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print("\n✅ Migration complete!")
    print("\n📝 Next steps:")
    print("1. Restart the backend server")
    print("2. Run the course content seeder to add sample lessons")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    exit(1)


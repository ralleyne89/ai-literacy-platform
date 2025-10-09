#!/usr/bin/env python3
"""
Migration script to add target_domains column to training_module table
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from models import db
from sqlalchemy import text

def migrate():
    """Add target_domains column to training_module table"""
    with app.app_context():
        try:
            # Check if column already exists
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('training_module')]
            
            if 'target_domains' in columns:
                print("✅ Column 'target_domains' already exists in training_module table")
                return
            
            # Add the column
            with db.engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE training_module ADD COLUMN target_domains TEXT"
                ))
                conn.commit()
            
            print("✅ Successfully added 'target_domains' column to training_module table")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            raise

if __name__ == '__main__':
    migrate()


#!/usr/bin/env python3
"""
Simple script to seed training modules
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from seeders.training import seed_training_modules

if __name__ == '__main__':
    with app.app_context():
        seed_training_modules(force=True, silent=False)


#!/bin/bash

# Setup script for Course Recommendations feature
# This script runs all necessary migrations and seeders

echo "🚀 Setting up Course Recommendations feature..."
echo ""

# Navigate to backend directory
cd backend

# Step 1: Run database migration
echo "📊 Step 1: Running database migration..."
python3 run_migration.py
if [ $? -ne 0 ]; then
    echo "❌ Migration failed!"
    exit 1
fi
echo ""

# Step 2: Seed training modules
echo "🌱 Step 2: Seeding training modules with domain mappings..."
python3 seed_modules.py
if [ $? -ne 0 ]; then
    echo "❌ Seeding failed!"
    exit 1
fi
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Restart your backend server (if running)"
echo "2. Login to the platform"
echo "3. Take an assessment (or use existing results)"
echo "4. Visit the Dashboard to see personalized course recommendations"
echo ""
echo "For more details, see COURSE_RECOMMENDATIONS_IMPLEMENTATION.md"


#!/usr/bin/env python3
"""
Database initialization script for AI Literacy Platform
"""

from app import app
from models import db, User, Assessment, AssessmentResult, TrainingModule, UserProgress, Certification
import json

def init_database():
    """Initialize the database with tables and sample data"""
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✅ Database tables created successfully")
        
        # Add sample assessment questions to database (optional)
        sample_questions = [
            {
                'title': 'LLM Understanding',
                'description': 'Test understanding of Large Language Models',
                'domain': 'Functional',
                'question_text': 'Which of the following best describes the primary function of a Large Language Model (LLM)?',
                'option_a': 'To store and retrieve large amounts of data efficiently',
                'option_b': 'To generate human-like text based on patterns learned from training data',
                'option_c': 'To perform complex mathematical calculations at high speed',
                'option_d': 'To create visual representations of data and information',
                'correct_answer': 'B',
                'explanation': 'LLMs are designed to understand and generate human-like text by learning patterns from vast amounts of text data during training.',
                'difficulty_level': 1
            },
            {
                'title': 'AI Ethics in Hiring',
                'description': 'Test understanding of ethical AI considerations',
                'domain': 'Ethical',
                'question_text': 'What is the most important consideration when using AI tools for hiring decisions?',
                'option_a': 'Ensuring the AI can process applications faster than humans',
                'option_b': 'Making sure the AI reduces hiring costs significantly',
                'option_c': 'Checking for bias and ensuring fair treatment of all candidates',
                'option_d': 'Implementing AI that can work without any human oversight',
                'correct_answer': 'C',
                'explanation': 'Bias detection and fair treatment are crucial ethical considerations when using AI in hiring to avoid discrimination.',
                'difficulty_level': 2
            }
        ]
        
        # Check if questions already exist
        existing_questions = Assessment.query.count()
        if existing_questions == 0:
            for q_data in sample_questions:
                question = Assessment(**q_data)
                db.session.add(question)
            
            db.session.commit()
            print(f"✅ Added {len(sample_questions)} sample assessment questions")
        else:
            print(f"ℹ️  Database already contains {existing_questions} assessment questions")
        
        # Add sample training modules
        sample_modules = [
            {
                'title': 'AI Fundamentals for Sales Teams',
                'description': 'Learn how to leverage AI tools for lead generation, customer insights, and sales automation.',
                'role_specific': 'Sales',
                'difficulty_level': 1,
                'estimated_duration_minutes': 45,
                'content_type': 'interactive',
                'is_premium': False,
                'learning_objectives': json.dumps([
                    'Understand AI applications in sales processes',
                    'Use AI for lead scoring and qualification',
                    'Implement AI-powered customer insights'
                ])
            },
            {
                'title': 'Ethical AI in HR Practices',
                'description': 'Navigate the ethical considerations of using AI in recruitment, performance evaluation, and employee management.',
                'role_specific': 'HR',
                'difficulty_level': 2,
                'estimated_duration_minutes': 60,
                'content_type': 'video',
                'is_premium': True,
                'learning_objectives': json.dumps([
                    'Identify bias in AI hiring tools',
                    'Implement fair AI practices',
                    'Ensure compliance with employment laws'
                ])
            }
        ]
        
        existing_modules = TrainingModule.query.count()
        if existing_modules == 0:
            for m_data in sample_modules:
                module = TrainingModule(**m_data)
                db.session.add(module)
            
            db.session.commit()
            print(f"✅ Added {len(sample_modules)} sample training modules")
        else:
            print(f"ℹ️  Database already contains {existing_modules} training modules")
        
        print("🎉 Database initialization completed successfully!")

if __name__ == '__main__':
    init_database()

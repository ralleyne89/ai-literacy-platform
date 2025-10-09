from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.mutable import MutableDict, MutableList
from datetime import datetime
import uuid

# Initialize db here but it will be initialized in app.py
db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(50), nullable=True)  # Sales, HR, Marketing, Operations
    organization = db.Column(db.String(100), nullable=True)
    subscription_tier = db.Column(db.String(20), default='free')  # free, professional, enterprise
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assessment_results = db.relationship('AssessmentResult', backref='user', lazy=True)
    progress = db.relationship('UserProgress', backref='user', lazy=True)
    certifications = db.relationship('Certification', backref='user', lazy=True)

class Assessment(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    domain = db.Column(db.String(50), nullable=False)  # AI Fundamentals, Practical Usage, Ethics & Critical Thinking, AI Impact & Applications, Strategic Understanding
    question_text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(500), nullable=False)
    option_b = db.Column(db.String(500), nullable=False)
    option_c = db.Column(db.String(500), nullable=False)
    option_d = db.Column(db.String(500), nullable=False)
    correct_answer = db.Column(db.String(1), nullable=False)  # A, B, C, or D
    explanation = db.Column(db.Text, nullable=True)
    difficulty_level = db.Column(db.Integer, default=1)  # 1-5 scale
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AssessmentResult(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    total_score = db.Column(db.Integer, nullable=False)
    max_score = db.Column(db.Integer, nullable=False)
    percentage = db.Column(db.Float, nullable=False)
    functional_score = db.Column(db.Integer, default=0)
    ethical_score = db.Column(db.Integer, default=0)
    rhetorical_score = db.Column(db.Integer, default=0)
    pedagogical_score = db.Column(db.Integer, default=0)
    domain_scores = db.Column(MutableDict.as_mutable(db.JSON), nullable=True)
    time_taken_minutes = db.Column(db.Integer, nullable=True)
    recommendations = db.Column(db.Text, nullable=True)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

class TrainingModule(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    role_specific = db.Column(db.String(50), nullable=True)  # Sales, HR, Marketing, Operations, General
    difficulty_level = db.Column(db.Integer, default=1)  # 1-5 scale
    estimated_duration_minutes = db.Column(db.Integer, nullable=False)
    content_type = db.Column(db.String(50), nullable=False)  # video, interactive, reading, exercise
    content_url = db.Column(db.String(500), nullable=True)
    prerequisites = db.Column(db.Text, nullable=True)  # JSON array of module IDs
    learning_objectives = db.Column(db.Text, nullable=True)  # JSON array
    is_premium = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    target_domains = db.Column(db.Text, nullable=True)  # JSON array of assessment domains this module addresses

    # Relationships
    progress = db.relationship('UserProgress', backref='module', lazy=True)
    lessons = db.relationship('Lesson', backref='module', lazy=True, cascade='all, delete-orphan', order_by='Lesson.order_index')

class Lesson(db.Model):
    """Individual lessons within a training module"""
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module_id = db.Column(db.String(36), db.ForeignKey('training_module.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order_index = db.Column(db.Integer, nullable=False)  # Order within the module
    content_type = db.Column(db.String(50), nullable=False)  # video, text, quiz, interactive
    content = db.Column(db.Text, nullable=True)  # JSON content based on type
    estimated_duration_minutes = db.Column(db.Integer, default=10)
    is_required = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    progress = db.relationship('LessonProgress', backref='lesson', lazy=True, cascade='all, delete-orphan')

class LessonProgress(db.Model):
    """Track user progress through individual lessons"""
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    lesson_id = db.Column(db.String(36), db.ForeignKey('lesson.id'), nullable=False)
    module_id = db.Column(db.String(36), db.ForeignKey('training_module.id'), nullable=False)
    status = db.Column(db.String(20), default='not_started')  # not_started, in_progress, completed
    time_spent_minutes = db.Column(db.Integer, default=0)
    quiz_score = db.Column(db.Integer, nullable=True)  # For quiz lessons
    quiz_attempts = db.Column(db.Integer, default=0)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    last_accessed = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint: one progress record per user per lesson
    __table_args__ = (db.UniqueConstraint('user_id', 'lesson_id', name='unique_user_lesson'),)

class UserProgress(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    module_id = db.Column(db.String(36), db.ForeignKey('training_module.id'), nullable=False)
    status = db.Column(db.String(20), default='not_started')  # not_started, in_progress, completed
    progress_percentage = db.Column(db.Integer, default=0)
    time_spent_minutes = db.Column(db.Integer, default=0)
    current_lesson_id = db.Column(db.String(36), nullable=True)  # Track current lesson
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    last_accessed = db.Column(db.DateTime, default=datetime.utcnow)

class Certification(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    certification_type = db.Column(db.String(100), nullable=False)  # LitmusAI Professional, etc.
    catalog_id = db.Column(db.String(64), db.ForeignKey('certification_type.id'), nullable=True)
    verification_code = db.Column(db.String(50), unique=True, nullable=False)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_valid = db.Column(db.Boolean, default=True)
    badge_url = db.Column(db.String(500), nullable=True)
    skills_validated = db.Column(db.Text, nullable=True)  # JSON array of skills


class CertificationType(db.Model):
    id = db.Column(db.String(64), primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    requirements = db.Column(MutableList.as_mutable(db.JSON), default=list)
    estimated_time = db.Column(db.String(50), nullable=True)
    skills_validated = db.Column(MutableList.as_mutable(db.JSON), default=list)
    access_tier = db.Column(db.String(20), default='free')
    is_premium = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    certifications = db.relationship('Certification', backref='certification_type_entry', lazy=True)

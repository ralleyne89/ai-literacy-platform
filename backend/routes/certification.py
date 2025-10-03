from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Certification, User
import uuid
import random
import string

certification_bp = Blueprint('certification', __name__)

def generate_verification_code():
    """Generate a unique verification code for certificates"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@certification_bp.route('/available', methods=['GET'])
def get_available_certifications():
    """Get available certification types"""
    try:
        certifications = [
            {
                'id': 'litmusai-professional',
                'title': 'LitmusAI Professional',
                'description': 'Validates comprehensive AI literacy across all domains with practical application skills.',
                'requirements': [
                    'Complete AI readiness assessment with 70% or higher',
                    'Complete at least 3 role-specific training modules',
                    'Pass certification exam with 80% or higher'
                ],
                'estimated_time': '2-3 weeks',
                'skills_validated': [
                    'Functional AI understanding',
                    'Ethical AI practices',
                    'Rhetorical AI communication',
                    'Pedagogical AI learning'
                ],
                'is_premium': True
            },
            {
                'id': 'ai-fundamentals',
                'title': 'AI Fundamentals Certificate',
                'description': 'Entry-level certification for basic AI literacy and understanding.',
                'requirements': [
                    'Complete AI readiness assessment',
                    'Complete AI Fundamentals training module'
                ],
                'estimated_time': '1 week',
                'skills_validated': [
                    'Basic AI concepts',
                    'AI tool awareness',
                    'Prompt engineering basics'
                ],
                'is_premium': False
            },
            {
                'id': 'ai-ethics-specialist',
                'title': 'AI Ethics Specialist',
                'description': 'Specialized certification focusing on ethical AI implementation and governance.',
                'requirements': [
                    'Complete ethical AI training modules',
                    'Pass ethics-focused assessment',
                    'Complete case study project'
                ],
                'estimated_time': '3-4 weeks',
                'skills_validated': [
                    'AI bias detection',
                    'Ethical AI frameworks',
                    'AI governance practices',
                    'Compliance and regulation'
                ],
                'is_premium': True
            }
        ]
        
        return jsonify({'certifications': certifications}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get certifications', 'details': str(e)}), 500

@certification_bp.route('/earned', methods=['GET'])
@jwt_required()
def get_earned_certifications():
    """Get user's earned certifications"""
    try:
        user_id = get_jwt_identity()
        
        # In production, this would query the database
        # For now, return sample data
        certifications = [
            {
                'id': 'cert-001',
                'certification_type': 'AI Fundamentals Certificate',
                'verification_code': 'AF123456',
                'issued_at': '2024-01-15T10:30:00Z',
                'expires_at': None,
                'is_valid': True,
                'badge_url': '/badges/ai-fundamentals.png',
                'skills_validated': [
                    'Basic AI concepts',
                    'AI tool awareness',
                    'Prompt engineering basics'
                ]
            }
        ]
        
        return jsonify({'certifications': certifications}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get earned certifications', 'details': str(e)}), 500

@certification_bp.route('/verify/<verification_code>', methods=['GET'])
def verify_certification(verification_code):
    """Verify a certification by its verification code"""
    try:
        # In production, this would query the database
        # For now, return sample verification data
        if verification_code == 'AF123456':
            return jsonify({
                'valid': True,
                'certification': {
                    'certification_type': 'AI Fundamentals Certificate',
                    'holder_name': 'John Doe',
                    'issued_at': '2024-01-15T10:30:00Z',
                    'expires_at': None,
                    'skills_validated': [
                        'Basic AI concepts',
                        'AI tool awareness',
                        'Prompt engineering basics'
                    ]
                }
            }), 200
        else:
            return jsonify({
                'valid': False,
                'message': 'Certification not found or invalid'
            }), 404
        
    except Exception as e:
        return jsonify({'error': 'Failed to verify certification', 'details': str(e)}), 500

@certification_bp.route('/apply/<certification_id>', methods=['POST'])
@jwt_required()
def apply_for_certification(certification_id):
    """Apply for a certification"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user meets requirements (simplified for demo)
        if certification_id == 'ai-fundamentals':
            # For demo, automatically grant the certification
            verification_code = generate_verification_code()
            
            # In production, this would create a database record
            return jsonify({
                'message': 'Certification granted successfully',
                'certification': {
                    'certification_type': 'AI Fundamentals Certificate',
                    'verification_code': verification_code,
                    'issued_at': '2024-01-20T15:30:00Z',
                    'skills_validated': [
                        'Basic AI concepts',
                        'AI tool awareness',
                        'Prompt engineering basics'
                    ]
                }
            }), 201
        else:
            return jsonify({
                'message': 'Application submitted for review',
                'status': 'pending',
                'estimated_review_time': '3-5 business days'
            }), 202
        
    except Exception as e:
        return jsonify({'error': 'Failed to apply for certification', 'details': str(e)}), 500

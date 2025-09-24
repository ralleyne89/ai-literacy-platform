from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, TrainingModule, UserProgress, User

training_bp = Blueprint('training', __name__)

@training_bp.route('/modules', methods=['GET'])
def get_training_modules():
    """Get available training modules"""
    try:
        # Sample training modules - in production, these would be in the database
        modules = [
            {
                'id': '1',
                'title': 'AI Fundamentals for Sales Teams',
                'description': 'Learn how to leverage AI tools for lead generation, customer insights, and sales automation.',
                'role_specific': 'Sales',
                'difficulty_level': 1,
                'estimated_duration_minutes': 45,
                'content_type': 'interactive',
                'is_premium': False,
                'learning_objectives': [
                    'Understand AI applications in sales processes',
                    'Use AI for lead scoring and qualification',
                    'Implement AI-powered customer insights'
                ]
            },
            {
                'id': '2',
                'title': 'Ethical AI in HR Practices',
                'description': 'Navigate the ethical considerations of using AI in recruitment, performance evaluation, and employee management.',
                'role_specific': 'HR',
                'difficulty_level': 2,
                'estimated_duration_minutes': 60,
                'content_type': 'video',
                'is_premium': True,
                'learning_objectives': [
                    'Identify bias in AI hiring tools',
                    'Implement fair AI practices',
                    'Ensure compliance with employment laws'
                ]
            },
            {
                'id': '3',
                'title': 'AI-Powered Marketing Campaigns',
                'description': 'Create data-driven marketing strategies using AI for personalization, content creation, and campaign optimization.',
                'role_specific': 'Marketing',
                'difficulty_level': 2,
                'estimated_duration_minutes': 75,
                'content_type': 'interactive',
                'is_premium': True,
                'learning_objectives': [
                    'Design AI-driven marketing campaigns',
                    'Use AI for content personalization',
                    'Optimize campaigns with AI analytics'
                ]
            },
            {
                'id': '4',
                'title': 'Operational Efficiency with AI',
                'description': 'Streamline operations using AI for process automation, predictive maintenance, and resource optimization.',
                'role_specific': 'Operations',
                'difficulty_level': 3,
                'estimated_duration_minutes': 90,
                'content_type': 'exercise',
                'is_premium': True,
                'learning_objectives': [
                    'Implement AI process automation',
                    'Use predictive analytics for operations',
                    'Optimize resource allocation with AI'
                ]
            },
            {
                'id': '5',
                'title': 'Prompt Engineering Mastery',
                'description': 'Master the art of crafting effective prompts for various AI tools and applications.',
                'role_specific': 'General',
                'difficulty_level': 2,
                'estimated_duration_minutes': 50,
                'content_type': 'interactive',
                'is_premium': False,
                'learning_objectives': [
                    'Write effective AI prompts',
                    'Understand prompt engineering techniques',
                    'Apply prompts to real-world scenarios'
                ]
            }
        ]
        
        # Filter by role if specified
        role_filter = request.args.get('role')
        if role_filter:
            modules = [m for m in modules if m['role_specific'] == role_filter or m['role_specific'] == 'General']
        
        return jsonify({'modules': modules}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get training modules', 'details': str(e)}), 500

@training_bp.route('/progress', methods=['GET'])
@jwt_required()
def get_user_progress():
    """Get user's training progress"""
    try:
        user_id = get_jwt_identity()
        
        # In production, this would query the database
        # For now, return sample progress data
        progress = [
            {
                'module_id': '1',
                'module_title': 'AI Fundamentals for Sales Teams',
                'status': 'completed',
                'progress_percentage': 100,
                'time_spent_minutes': 45,
                'completed_at': '2024-01-15T10:30:00Z'
            },
            {
                'module_id': '5',
                'module_title': 'Prompt Engineering Mastery',
                'status': 'in_progress',
                'progress_percentage': 60,
                'time_spent_minutes': 30,
                'last_accessed': '2024-01-20T14:15:00Z'
            }
        ]
        
        return jsonify({'progress': progress}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get progress', 'details': str(e)}), 500

@training_bp.route('/enroll/<module_id>', methods=['POST'])
@jwt_required()
def enroll_in_module(module_id):
    """Enroll user in a training module"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is already enrolled
        # In production, this would check the database
        
        # For now, return success
        return jsonify({
            'message': 'Successfully enrolled in module',
            'module_id': module_id,
            'status': 'enrolled'
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to enroll in module', 'details': str(e)}), 500

@training_bp.route('/progress/<module_id>', methods=['PUT'])
@jwt_required()
def update_progress(module_id):
    """Update user's progress in a module"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        progress_percentage = data.get('progress_percentage', 0)
        time_spent = data.get('time_spent_minutes', 0)
        
        # In production, this would update the database
        
        return jsonify({
            'message': 'Progress updated successfully',
            'module_id': module_id,
            'progress_percentage': progress_percentage,
            'time_spent_minutes': time_spent
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to update progress', 'details': str(e)}), 500

"""
Course Content API Routes
Handles lesson viewing, progress tracking, and quiz submissions
"""

from flask import Blueprint, jsonify, request, g
from models import db, TrainingModule, Lesson, LessonProgress, UserProgress
from routes.auth import supabase_jwt_required, get_supabase_identity
import structlog
import json
from datetime import datetime

logger = structlog.get_logger()

course_content_bp = Blueprint('course_content', __name__)


@course_content_bp.route('/modules/<module_id>/lessons', methods=['GET'])
@supabase_jwt_required()
def get_module_lessons(module_id):
    """Get all lessons for a training module with user progress"""
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()
        
        # Get the module
        module = TrainingModule.query.get(module_id)
        if not module:
            return jsonify({'error': 'Module not found'}), 404
        
        # Get all lessons for this module (ordered by order_index)
        lessons = Lesson.query.filter_by(module_id=module_id)\
                             .order_by(Lesson.order_index)\
                             .all()
        
        # Get user's progress for these lessons
        lesson_ids = [lesson.id for lesson in lessons]
        progress_records = LessonProgress.query.filter(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id.in_(lesson_ids)
        ).all()
        
        # Create a map of lesson_id -> progress
        progress_map = {p.lesson_id: p for p in progress_records}
        
        # Build response
        lessons_data = []
        for lesson in lessons:
            progress = progress_map.get(lesson.id)
            
            lessons_data.append({
                'id': lesson.id,
                'title': lesson.title,
                'description': lesson.description,
                'order_index': lesson.order_index,
                'content_type': lesson.content_type,
                'estimated_duration_minutes': lesson.estimated_duration_minutes,
                'is_required': lesson.is_required,
                'status': progress.status if progress else 'not_started',
                'time_spent_minutes': progress.time_spent_minutes if progress else 0,
                'quiz_score': progress.quiz_score if progress else None,
                'completed_at': progress.completed_at.isoformat() if progress and progress.completed_at else None
            })
        
        logger.info('module_lessons_retrieved', 
                   user_id=user_id, 
                   module_id=module_id, 
                   lesson_count=len(lessons))
        
        return jsonify({
            'module': {
                'id': module.id,
                'title': module.title,
                'description': module.description,
                'total_lessons': len(lessons)
            },
            'lessons': lessons_data
        }), 200
        
    except Exception as e:
        logger.exception('get_module_lessons_failed', error=str(e))
        return jsonify({'error': 'Failed to get lessons', 'details': str(e)}), 500


@course_content_bp.route('/lessons/<lesson_id>', methods=['GET'])
@supabase_jwt_required()
def get_lesson_content(lesson_id):
    """Get detailed content for a specific lesson"""
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()
        
        # Get the lesson
        lesson = Lesson.query.get(lesson_id)
        if not lesson:
            return jsonify({'error': 'Lesson not found'}), 404
        
        # Get or create progress record
        progress = LessonProgress.query.filter_by(
            user_id=user_id,
            lesson_id=lesson_id
        ).first()
        
        if not progress:
            # Create new progress record
            progress = LessonProgress(
                user_id=user_id,
                lesson_id=lesson_id,
                module_id=lesson.module_id,
                status='in_progress',
                started_at=datetime.utcnow(),
                last_accessed=datetime.utcnow()
            )
            db.session.add(progress)
            
            # Update module progress
            module_progress = UserProgress.query.filter_by(
                user_id=user_id,
                module_id=lesson.module_id
            ).first()
            
            if not module_progress:
                module_progress = UserProgress(
                    user_id=user_id,
                    module_id=lesson.module_id,
                    status='in_progress',
                    started_at=datetime.utcnow(),
                    current_lesson_id=lesson_id
                )
                db.session.add(module_progress)
            else:
                module_progress.current_lesson_id = lesson_id
                module_progress.last_accessed = datetime.utcnow()
                if module_progress.status == 'not_started':
                    module_progress.status = 'in_progress'
                    module_progress.started_at = datetime.utcnow()
            
            db.session.commit()
        else:
            # Update last accessed
            progress.last_accessed = datetime.utcnow()
            db.session.commit()
        
        # Parse content JSON
        content_data = json.loads(lesson.content) if lesson.content else {}
        
        # Build response
        lesson_data = {
            'id': lesson.id,
            'module_id': lesson.module_id,
            'title': lesson.title,
            'description': lesson.description,
            'order_index': lesson.order_index,
            'content_type': lesson.content_type,
            'content': content_data,
            'estimated_duration_minutes': lesson.estimated_duration_minutes,
            'is_required': lesson.is_required,
            'progress': {
                'status': progress.status,
                'time_spent_minutes': progress.time_spent_minutes,
                'quiz_score': progress.quiz_score,
                'quiz_attempts': progress.quiz_attempts,
                'started_at': progress.started_at.isoformat() if progress.started_at else None,
                'completed_at': progress.completed_at.isoformat() if progress.completed_at else None
            }
        }
        
        logger.info('lesson_content_retrieved', 
                   user_id=user_id, 
                   lesson_id=lesson_id,
                   content_type=lesson.content_type)
        
        return jsonify(lesson_data), 200
        
    except Exception as e:
        logger.exception('get_lesson_content_failed', error=str(e))
        return jsonify({'error': 'Failed to get lesson content', 'details': str(e)}), 500


@course_content_bp.route('/lessons/<lesson_id>/complete', methods=['POST'])
@supabase_jwt_required()
def complete_lesson(lesson_id):
    """Mark a lesson as complete and update progress"""
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()
        data = request.get_json() or {}
        
        # Get the lesson
        lesson = Lesson.query.get(lesson_id)
        if not lesson:
            return jsonify({'error': 'Lesson not found'}), 404
        
        # Get or create progress record
        progress = LessonProgress.query.filter_by(
            user_id=user_id,
            lesson_id=lesson_id
        ).first()
        
        if not progress:
            progress = LessonProgress(
                user_id=user_id,
                lesson_id=lesson_id,
                module_id=lesson.module_id,
                started_at=datetime.utcnow()
            )
            db.session.add(progress)
        
        # Update progress
        progress.status = 'completed'
        progress.completed_at = datetime.utcnow()
        progress.time_spent_minutes = data.get('time_spent_minutes', progress.time_spent_minutes)
        
        # For quiz lessons, save score
        if lesson.content_type == 'quiz' and 'quiz_score' in data:
            progress.quiz_score = data['quiz_score']
            progress.quiz_attempts += 1
        
        db.session.commit()
        
        # Update module progress
        update_module_progress(user_id, lesson.module_id)
        
        logger.info('lesson_completed', 
                   user_id=user_id, 
                   lesson_id=lesson_id,
                   quiz_score=progress.quiz_score)
        
        return jsonify({
            'message': 'Lesson completed successfully',
            'progress': {
                'status': progress.status,
                'completed_at': progress.completed_at.isoformat(),
                'quiz_score': progress.quiz_score
            }
        }), 200
        
    except Exception as e:
        logger.exception('complete_lesson_failed', error=str(e))
        return jsonify({'error': 'Failed to complete lesson', 'details': str(e)}), 500


@course_content_bp.route('/lessons/<lesson_id>/progress', methods=['PUT'])
@supabase_jwt_required()
def update_lesson_progress(lesson_id):
    """Update lesson progress (time spent, status, etc.)"""
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()
        data = request.get_json() or {}
        
        # Get or create progress record
        progress = LessonProgress.query.filter_by(
            user_id=user_id,
            lesson_id=lesson_id
        ).first()
        
        if not progress:
            lesson = Lesson.query.get(lesson_id)
            if not lesson:
                return jsonify({'error': 'Lesson not found'}), 404
            
            progress = LessonProgress(
                user_id=user_id,
                lesson_id=lesson_id,
                module_id=lesson.module_id,
                started_at=datetime.utcnow()
            )
            db.session.add(progress)
        
        # Update fields
        if 'time_spent_minutes' in data:
            progress.time_spent_minutes = data['time_spent_minutes']
        if 'status' in data:
            progress.status = data['status']
        
        progress.last_accessed = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Progress updated successfully'}), 200
        
    except Exception as e:
        logger.exception('update_lesson_progress_failed', error=str(e))
        return jsonify({'error': 'Failed to update progress', 'details': str(e)}), 500


def update_module_progress(user_id, module_id):
    """Calculate and update overall module progress"""
    try:
        # Get all lessons for the module
        lessons = Lesson.query.filter_by(module_id=module_id).all()
        total_lessons = len(lessons)
        
        if total_lessons == 0:
            return
        
        # Get completed lessons
        completed_lessons = LessonProgress.query.filter_by(
            user_id=user_id,
            module_id=module_id,
            status='completed'
        ).count()
        
        # Calculate progress percentage
        progress_percentage = int((completed_lessons / total_lessons) * 100)
        
        # Get or create module progress
        module_progress = UserProgress.query.filter_by(
            user_id=user_id,
            module_id=module_id
        ).first()
        
        if not module_progress:
            module_progress = UserProgress(
                user_id=user_id,
                module_id=module_id,
                started_at=datetime.utcnow()
            )
            db.session.add(module_progress)
        
        # Update progress
        module_progress.progress_percentage = progress_percentage
        module_progress.last_accessed = datetime.utcnow()
        
        # Update status
        if progress_percentage == 100:
            module_progress.status = 'completed'
            module_progress.completed_at = datetime.utcnow()
        elif progress_percentage > 0:
            module_progress.status = 'in_progress'
        
        db.session.commit()
        
        logger.info('module_progress_updated',
                   user_id=user_id,
                   module_id=module_id,
                   progress_percentage=progress_percentage,
                   status=module_progress.status)
        
    except Exception as e:
        logger.exception('update_module_progress_failed', error=str(e))


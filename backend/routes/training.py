from flask import Blueprint, request, jsonify, g
from routes import supabase_jwt_required, get_supabase_identity
from models import db, TrainingModule, UserProgress
from logging_config import get_logger
from datetime import datetime
import json
import uuid

training_bp = Blueprint('training', __name__)
logger = get_logger(__name__)


def parse_json_field(value, default=None):
    if value is None:
        return default if default is not None else []
    try:
        return json.loads(value)
    except Exception:
        return default if default is not None else []


def serialize_module(module, include_details: bool = False):
    payload = parse_json_field(module.prerequisites, {})

    if isinstance(payload, dict):
        requirements = payload.get('requirements') or []
        resources = payload.get('resources') or []
        sections = payload.get('sections') or []
        metadata = payload.get('metadata') or {}
    elif isinstance(payload, list):
        requirements = payload
        resources = []
        sections = []
        metadata = {}
    else:
        requirements = []
        resources = []
        sections = []
        metadata = {}

    learning_objectives = parse_json_field(module.learning_objectives, [])

    access_tier = metadata.get('access_tier') if isinstance(metadata, dict) else None

    data = {
        'id': module.id,
        'title': module.title,
        'description': module.description,
        'role_specific': module.role_specific,
        'difficulty_level': module.difficulty_level,
        'estimated_duration_minutes': module.estimated_duration_minutes,
        'content_type': module.content_type,
        'content_url': module.content_url,
        'is_premium': module.is_premium,
        'learning_objectives': learning_objectives,
        'prerequisites': requirements,
        'metadata': metadata if isinstance(metadata, dict) else {},
        'access_tier': access_tier or 'free'
    }

    if include_details:
        data.update({
            'resources': resources,
            'content_sections': sections,
            'created_at': module.created_at.isoformat() if module.created_at else None
        })

    return data


@training_bp.route('/modules', methods=['GET'])
def get_training_modules():
    try:
        role_filter = request.args.get('role')
        access_tier = request.args.get('tier')

        query = TrainingModule.query.filter_by(is_active=True)

        if role_filter and role_filter != 'All':
            query = query.filter(
                (TrainingModule.role_specific == role_filter) |
                (TrainingModule.role_specific == 'General')
            )

        records = query.order_by(TrainingModule.title.asc()).all()
        modules = [serialize_module(module) for module in records]

        if access_tier:
            modules = [m for m in modules if m.get('access_tier') == access_tier]

        response_payload = {'modules': modules}

        if not records:
            response_payload['message'] = 'No training modules configured yet. Use `flask seed-training-modules` to load defaults.'
        elif access_tier and not modules:
            response_payload['message'] = f'No modules available for tier {access_tier}.'

        logger.info(
            'training_modules_listed',
            role_filter=role_filter,
            access_tier=access_tier,
            count=len(modules),
        )

        return jsonify(response_payload), 200

    except Exception as e:
        logger.exception('training_modules_fetch_failed', error=str(e))
        return jsonify({'error': 'Failed to get training modules', 'details': str(e)}), 500


@training_bp.route('/modules/<module_id>', methods=['GET'])
def get_training_module_detail(module_id):
    try:
      module = TrainingModule.query.get(module_id)
      if not module or not module.is_active:
          return jsonify({'error': 'Module not found'}), 404

      serialized = serialize_module(module, include_details=True)
      logger.info('training_module_detail', module_id=module_id)
      return jsonify({'module': serialized}), 200

    except Exception as e:
      logger.exception('training_module_detail_failed', module_id=module_id, error=str(e))
      return jsonify({'error': 'Failed to get module', 'details': str(e)}), 500


@training_bp.route('/progress', methods=['GET'])
@supabase_jwt_required()
def get_user_progress():
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()

        records = (UserProgress.query
                   .filter_by(user_id=user_id)
                   .join(TrainingModule, TrainingModule.id == UserProgress.module_id)
                   .add_entity(TrainingModule)
                   .all())

        progress_payload = []
        for progress, module in records:
            progress_payload.append({
                'module_id': progress.module_id,
                'module_title': module.title,
                'status': progress.status,
                'progress_percentage': progress.progress_percentage,
                'time_spent_minutes': progress.time_spent_minutes,
                'last_accessed': progress.last_accessed.isoformat() if progress.last_accessed else None,
                'completed_at': progress.completed_at.isoformat() if progress.completed_at else None
            })

        logger.info('training_progress_listed', user_id=user_id, count=len(progress_payload))
        return jsonify({'progress': progress_payload}), 200

    except Exception as e:
        logger.exception('training_progress_failed', user_id=user_id, error=str(e))
        return jsonify({'error': 'Failed to get progress', 'details': str(e)}), 500


@training_bp.route('/enroll/<module_id>', methods=['POST'])
@supabase_jwt_required()
def enroll_in_module(module_id):
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()

        module = TrainingModule.query.get(module_id)
        if not module or not module.is_active:
            return jsonify({'error': 'Module not found'}), 404

        progress = UserProgress.query.filter_by(user_id=user_id, module_id=module_id).first()

        if progress:
            progress.status = 'in_progress'
            progress.last_accessed = datetime.utcnow()
        else:
            progress = UserProgress(
                id=str(uuid.uuid4()),
                user_id=user_id,
                module_id=module_id,
                status='in_progress',
                progress_percentage=0,
                time_spent_minutes=0,
                started_at=datetime.utcnow(),
                last_accessed=datetime.utcnow()
            )
            db.session.add(progress)

        db.session.commit()

        logger.info('training_module_enrolled', user_id=user_id, module_id=module_id)

        return jsonify({
            'message': 'Successfully enrolled in module',
            'module_id': module_id,
            'status': progress.status
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('training_module_enroll_failed', user_id=user_id, module_id=module_id, error=str(e))
        return jsonify({'error': 'Failed to enroll in module', 'details': str(e)}), 500


@training_bp.route('/progress/<module_id>', methods=['PUT'])
@supabase_jwt_required()
def update_progress(module_id):
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()
        data = request.get_json() or {}

        progress_percentage = data.get('progress_percentage', 0)
        time_spent = data.get('time_spent_minutes', 0)
        status = data.get('status', 'in_progress')
        mark_complete = status == 'completed' or progress_percentage >= 100

        module = TrainingModule.query.get(module_id)
        if not module or not module.is_active:
            return jsonify({'error': 'Module not found'}), 404

        progress = UserProgress.query.filter_by(user_id=user_id, module_id=module_id).first()

        if not progress:
            progress = UserProgress(
                id=str(uuid.uuid4()),
                user_id=user_id,
                module_id=module_id,
                status='in_progress',
                progress_percentage=0,
                time_spent_minutes=0,
                started_at=datetime.utcnow()
            )
            db.session.add(progress)

        progress.progress_percentage = min(100, max(progress_percentage, progress.progress_percentage or 0))
        progress.time_spent_minutes = max(time_spent, progress.time_spent_minutes or 0)
        progress.status = 'completed' if mark_complete else 'in_progress'
        progress.last_accessed = datetime.utcnow()

        if mark_complete and not progress.completed_at:
            progress.completed_at = datetime.utcnow()

        db.session.commit()

        logger.info(
            'training_progress_updated',
            user_id=user_id,
            module_id=module_id,
            status=progress.status,
            progress_percentage=progress.progress_percentage,
        )

        return jsonify({
            'message': 'Progress updated successfully',
            'module_id': module_id,
            'status': progress.status,
            'progress_percentage': progress.progress_percentage,
            'time_spent_minutes': progress.time_spent_minutes,
            'completed_at': progress.completed_at.isoformat() if progress.completed_at else None
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('training_progress_update_failed', user_id=user_id, module_id=module_id, error=str(e))
        return jsonify({'error': 'Failed to update progress', 'details': str(e)}), 500

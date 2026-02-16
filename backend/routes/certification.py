from datetime import datetime, timedelta
from typing import Optional

from flask import Blueprint, request, jsonify, g
from routes import supabase_jwt_required, get_supabase_identity, get_supabase_claims
from models import (
    db,
    Certification,
    CertificationType,
    User,
    UserProgress,
    AssessmentResult,
)
from logging_config import get_logger
import json
import random
import string

certification_bp = Blueprint('certification', __name__)
logger = get_logger(__name__)

TIER_RANK = {
    'free': 0,
    'premium': 1,        # Stripe payment tier
    'professional': 1,   # Legacy/alias for premium
    'enterprise': 2,
    'affiliate': 1,
}


def _normalize_tier(value):
    return (value or 'free').lower()


def _has_tier_access(user_tier, required_tier):
    user_rank = TIER_RANK.get(_normalize_tier(user_tier), 0)
    required_rank = TIER_RANK.get(_normalize_tier(required_tier), 0)
    return user_rank >= required_rank


def _serialize_certification_type(record: CertificationType):
    return {
        'id': record.id,
        'title': record.title,
        'description': record.description,
        'requirements': record.requirements or [],
        'estimated_time': record.estimated_time,
        'skills_validated': record.skills_validated or [],
        'access_tier': record.access_tier or 'free',
        'is_premium': record.is_premium,
        'updated_at': record.updated_at.isoformat() if record.updated_at else None,
    }


def _serialize_awarded_certification(certification: Certification, cert_type: Optional[CertificationType] = None):
    skills = _parse_skill_payload(certification.skills_validated)
    if not skills and cert_type:
        skills = cert_type.skills_validated or []

    return {
        'catalog_id': certification.catalog_id,
        'certification_type': certification.certification_type,
        'verification_code': certification.verification_code,
        'issued_at': certification.issued_at.isoformat() if certification.issued_at else None,
        'expires_at': certification.expires_at.isoformat() if certification.expires_at else None,
        'skills_validated': skills
    }


def _parse_skill_payload(raw_value):
    if not raw_value:
        return []
    if isinstance(raw_value, list):
        return raw_value
    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, list) else []
    except (TypeError, ValueError):
        return []


def _generate_unique_verification_code():
    code = generate_verification_code()
    # Avoid collisions (unlikely but protects manual overrides)
    while Certification.query.filter_by(verification_code=code).first():
        code = generate_verification_code()
    return code


def _extract_domain_score(assessment: Optional[AssessmentResult], domain: str) -> int:
    if not assessment:
        return 0

    payload = assessment.domain_scores
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except ValueError:
            payload = {}

    if isinstance(payload, dict):
        entry = payload.get(domain) or {}
        if isinstance(entry, dict):
            return int(entry.get('score', 0) or 0)

    fallback_map = {
        'AI Fundamentals': assessment.functional_score or 0,
        'Practical Usage': assessment.ethical_score or 0,
        'Ethics & Critical Thinking': assessment.rhetorical_score or 0,
        'AI Impact & Applications': assessment.pedagogical_score or 0,
        'Strategic Understanding': 0,
    }
    return int(fallback_map.get(domain, 0) or 0)


def _evaluate_certification_readiness(
    cert_type: CertificationType,
    assessment: Optional[AssessmentResult],
    completed_modules: int,
):
    reasons = []

    if cert_type.id == 'ai-fundamentals':
        if not assessment:
            reasons.append('Complete the AI readiness assessment to unlock this certificate.')
    elif cert_type.id == 'litmusai-professional':
        percentage = assessment.percentage if assessment else 0
        if percentage is None or percentage < 70:
            reasons.append('Score at least 70% on the AI readiness assessment.')
        if completed_modules < 3:
            reasons.append('Complete at least 3 training modules before applying.')
    elif cert_type.id == 'ai-ethics-specialist':
        ethics_score = _extract_domain_score(assessment, 'Ethics & Critical Thinking')
        if ethics_score < 3:
            reasons.append('Increase your Ethics & Critical Thinking score to 3 or higher.')
        if completed_modules < 2:
            reasons.append('Complete at least 2 training modules to demonstrate applied practice.')

    return {'eligible': len(reasons) == 0, 'reasons': reasons}

def generate_verification_code():
    """Generate a unique verification code for certificates"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@certification_bp.route('/available', methods=['GET'])
@supabase_jwt_required(optional=True)
def get_available_certifications():
    """Get available certification types"""
    try:
        user_id = g.get('current_user_id') or get_supabase_identity(optional=True)
        claims = g.get('supabase_claims') or get_supabase_claims(optional=True) or {}
        user = User.query.get(user_id) if user_id else None

        if user is None and user_id:
            email = (claims.get('email') or claims.get('user_email') or '').strip().lower()
            if email:
                metadata = claims.get('user_metadata') or {}
                user = User(
                    id=user_id,
                    email=email,
                    password_hash='supabase_managed',
                    first_name=metadata.get('first_name') or 'AI',
                    last_name=metadata.get('last_name') or 'Learner',
                    role=metadata.get('role'),
                    organization=metadata.get('organization')
                )
                db.session.add(user)
                db.session.commit()

        latest_assessment = None
        completed_modules = 0
        current_tier = _normalize_tier(user.subscription_tier) if user else 'free'
        if user:
            latest_assessment = (AssessmentResult.query
                                 .filter_by(user_id=user.id)
                                 .order_by(AssessmentResult.completed_at.desc())
                                 .first())
            completed_modules = (UserProgress.query
                                 .filter_by(user_id=user.id, status='completed')
                                 .count())

        records = CertificationType.query.order_by(CertificationType.title.asc()).all()
        payload = []
        for record in records:
            serialized = _serialize_certification_type(record)
            required_tier = record.access_tier or ('professional' if record.is_premium else 'free')
            upgrade_required = not _has_tier_access(current_tier, required_tier)

            if user:
                readiness = _evaluate_certification_readiness(record, latest_assessment, completed_modules)
            else:
                readiness = {
                    'eligible': False,
                    'reasons': ['Sign in to evaluate your certification readiness.']
                }

            missing_requirements = list(readiness['reasons'])
            if upgrade_required:
                missing_requirements.append(f'Upgrade to {required_tier} to unlock this certification.')

            serialized.update({
                'required_tier': required_tier,
                'current_tier': current_tier,
                'upgrade_required': upgrade_required,
                'eligible': readiness['eligible'] and not upgrade_required,
                'missing_requirements': missing_requirements
            })
            payload.append(serialized)

        response = {'certifications': payload}
        if not payload:
            response['message'] = 'No certification catalog configured. Run `flask seed-certifications` to load defaults.'

        logger.info('certification_catalog_listed', count=len(payload))
        return jsonify(response), 200

    except Exception as e:
        logger.exception('certification_catalog_failed', error=str(e))
        return jsonify({'error': 'Failed to get certifications', 'details': str(e)}), 500

@certification_bp.route('/earned', methods=['GET'])
@supabase_jwt_required()
def get_earned_certifications():
    """Get user's earned certifications"""
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()
        records = (Certification.query.filter_by(user_id=user_id)
                   .outerjoin(CertificationType, Certification.catalog_id == CertificationType.id)
                   .add_entity(CertificationType)
                   .order_by(Certification.issued_at.desc())
                   .all())

        payload = []
        for certification, catalog in records:
            payload.append({
                'id': certification.id,
                'catalog_id': certification.catalog_id,
                'certification_type': certification.certification_type,
                'verification_code': certification.verification_code,
                'issued_at': certification.issued_at.isoformat() if certification.issued_at else None,
                'expires_at': certification.expires_at.isoformat() if certification.expires_at else None,
                'is_valid': certification.is_valid,
                'badge_url': certification.badge_url,
                'skills_validated': _parse_skill_payload(certification.skills_validated) or (catalog.skills_validated if catalog else []),
                'access_tier': catalog.access_tier if catalog else None
            })

        logger.info('certifications_listed', user_id=user_id, count=len(payload))
        return jsonify({'certifications': payload}), 200

    except Exception as e:
        logger.exception('certifications_list_failed', user_id=user_id, error=str(e))
        return jsonify({'error': 'Failed to get earned certifications', 'details': str(e)}), 500

@certification_bp.route('/verify/<verification_code>', methods=['GET'])
def verify_certification(verification_code):
    """Verify a certification by its verification code"""
    try:
        record = (Certification.query
                  .filter_by(verification_code=verification_code)
                  .join(User, Certification.user_id == User.id)
                  .outerjoin(CertificationType, Certification.catalog_id == CertificationType.id)
                  .add_entity(User)
                  .add_entity(CertificationType)
                  .first())

        if not record:
            logger.info('certification_verification_failed', verification_code=verification_code)
            return jsonify({'valid': False, 'message': 'Certification not found or invalid'}), 404

        certification, user, catalog = record
        payload = {
            'certification_type': certification.certification_type,
            'catalog_id': certification.catalog_id,
            'holder_name': f"{user.first_name} {user.last_name}".strip(),
            'issued_at': certification.issued_at.isoformat() if certification.issued_at else None,
            'expires_at': certification.expires_at.isoformat() if certification.expires_at else None,
            'skills_validated': _parse_skill_payload(certification.skills_validated) or (catalog.skills_validated if catalog else []),
            'access_tier': catalog.access_tier if catalog else None,
            'is_valid': certification.is_valid,
        }

        logger.info('certification_verified', verification_code=verification_code, catalog_id=certification.catalog_id)
        return jsonify({'valid': True, 'certification': payload}), 200

    except Exception as e:
        logger.exception('certification_verify_failed', verification_code=verification_code, error=str(e))
        return jsonify({'error': 'Failed to verify certification', 'details': str(e)}), 500

@certification_bp.route('/apply/<certification_id>', methods=['POST'])
@supabase_jwt_required()
def apply_for_certification(certification_id):
    """Apply for a certification"""
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()
        user = User.query.get(user_id)
        
        if not user:
            logger.info('certification_apply_user_missing', user_id=user_id, certification_id=certification_id)
            return jsonify({'error': 'User not found'}), 404
        
        cert_type = CertificationType.query.get(certification_id)
        if not cert_type:
            logger.info('certification_apply_not_found', certification_id=certification_id, user_id=user_id)
            return jsonify({'error': 'Certification not found'}), 404

        user_tier = _normalize_tier(user.subscription_tier)
        required_tier = cert_type.access_tier or ('professional' if cert_type.is_premium else 'free')

        if not _has_tier_access(user_tier, required_tier):
            logger.info(
                'certification_apply_insufficient_tier',
                user_id=user_id,
                certification_id=certification_id,
                required_tier=required_tier,
                current_tier=user_tier,
            )
            return jsonify({
                'error': 'upgrade_required',
                'message': f'{cert_type.title} is available to {required_tier} plans. Upgrade your subscription to continue.',
                'required_tier': required_tier,
                'current_tier': user_tier
            }), 403

        existing_certification = (Certification.query
                                  .filter_by(user_id=user_id, catalog_id=cert_type.id)
                                  .order_by(Certification.issued_at.desc())
                                  .first())
        if existing_certification:
            logger.info(
                'certification_already_issued',
                user_id=user_id,
                certification_id=certification_id,
                verification_code=existing_certification.verification_code
            )
            return jsonify({
                'status': 'already_issued',
                'message': 'Certification already granted for this user.',
                'certification': _serialize_awarded_certification(existing_certification, cert_type)
            }), 200

        latest_assessment = (AssessmentResult.query
                             .filter_by(user_id=user_id)
                             .order_by(AssessmentResult.completed_at.desc())
                             .first())
        completed_modules = (UserProgress.query
                             .filter_by(user_id=user_id, status='completed')
                             .count())

        readiness = _evaluate_certification_readiness(cert_type, latest_assessment, completed_modules)
        if not readiness['eligible']:
            logger.info(
                'certification_apply_requirements_not_met',
                user_id=user_id,
                certification_id=certification_id,
                reasons=readiness['reasons'],
            )
            return jsonify({
                'message': 'Certification requirements not met yet.',
                'status': 'requirements_not_met',
                'missing_requirements': readiness['reasons']
            }), 422

        verification_code = _generate_unique_verification_code()
        issued_at = datetime.utcnow()
        expires_at = issued_at + timedelta(days=730) if cert_type.is_premium else None

        certification = Certification(
            user_id=user_id,
            certification_type=cert_type.title,
            catalog_id=cert_type.id,
            verification_code=verification_code,
            issued_at=issued_at,
            expires_at=expires_at,
            skills_validated=json.dumps(cert_type.skills_validated or []),
            badge_url=None
        )

        db.session.add(certification)
        db.session.commit()

        logger.info('certification_awarded', user_id=user_id, certification_id=certification_id, verification_code=verification_code)

        return jsonify({
            'status': 'issued',
            'message': 'Certification granted successfully',
            'certification': _serialize_awarded_certification(certification, cert_type)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.exception('certification_apply_failed', user_id=user_id, certification_id=certification_id, error=str(e))
        return jsonify({'error': 'Failed to apply for certification', 'details': str(e)}), 500

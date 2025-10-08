import jwt
from datetime import datetime

from app import app
from models import db, User, AssessmentResult, UserProgress, Certification, TrainingModule


def create_enterprise_user(email='enterprise@example.com'):
    user = User(
        email=email,
        password_hash='test-hash',
        first_name='Enterprise',
        last_name='User',
        subscription_tier='enterprise'
    )
    db.session.add(user)
    db.session.commit()
    return user


def seed_assessment_result(user_id):
    domain_scores = {
        'AI Fundamentals': {'score': 3, 'total': 3},
        'Practical Usage': {'score': 3, 'total': 3},
        'Ethics & Critical Thinking': {'score': 3, 'total': 3},
        'AI Impact & Applications': {'score': 3, 'total': 3},
        'Strategic Understanding': {'score': 3, 'total': 3},
    }

    result = AssessmentResult(
        user_id=user_id,
        total_score=12,
        max_score=15,
        percentage=80.0,
        domain_scores=domain_scores,
        time_taken_minutes=20,
    )
    db.session.add(result)
    db.session.commit()


def seed_completed_modules(user_id, count=3):
    modules = TrainingModule.query.limit(count).all()
    for module in modules:
        progress = UserProgress(
            user_id=user_id,
            module_id=module.id,
            status='completed',
            progress_percentage=100,
            time_spent_minutes=module.estimated_duration_minutes,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
        )
        db.session.add(progress)
    db.session.commit()


def test_apply_for_professional_certification_success(client):
    with app.app_context():
        user = create_enterprise_user()
        seed_assessment_result(user.id)
        seed_completed_modules(user.id, count=3)
        secret = app.config['SUPABASE_JWT_SECRET']
        token = jwt.encode({'sub': user.id}, secret, algorithm='HS256')

    response = client.post(
        '/api/certification/apply/litmusai-professional',
        headers={'Authorization': f'Bearer {token}'},
        json={}
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data['certification']['catalog_id'] == 'litmusai-professional'

    with app.app_context():
        record = Certification.query.filter_by(user_id=user.id, catalog_id='litmusai-professional').first()
        assert record is not None
        assert record.verification_code
        assert record.expires_at is not None

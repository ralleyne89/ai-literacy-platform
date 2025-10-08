import jwt

from app import app
from models import db, User, AssessmentResult
from routes.assessment import SAMPLE_QUESTIONS


def create_user(email='tester@example.com'):
    user = User(
        email=email,
        password_hash='test-hash',
        first_name='Test',
        last_name='User',
        subscription_tier='free'
    )
    db.session.add(user)
    db.session.commit()
    return user


def build_assessment_payload():
    answers = {}
    option_map = {}
    for question in SAMPLE_QUESTIONS:
        question_id = question['id']
        answers[question_id] = question['correct_answer']
        option_map[question_id] = {
            'A': question['option_a'],
            'B': question['option_b'],
            'C': question['option_c'],
            'D': question['option_d'],
        }
    return answers, option_map


def test_assessment_submit_persists_domain_scores(client):
    with app.app_context():
        user = create_user()
        secret = app.config['SUPABASE_JWT_SECRET']
        token = jwt.encode({'sub': user.id}, secret, algorithm='HS256')

    answers, option_map = build_assessment_payload()
    response = client.post(
        '/api/assessment/submit',
        json={'answers': answers, 'option_map': option_map, 'time_taken_minutes': 12},
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['saved'] is True
    assert 'domain_scores' in data
    assert data['domain_scores']['AI Fundamentals']['total'] > 0

    with app.app_context():
        record = AssessmentResult.query.filter_by(user_id=user.id).first()
        assert record is not None
        assert isinstance(record.domain_scores, dict)
        assert 'Strategic Understanding' in record.domain_scores
        assert record.domain_scores['Strategic Understanding']['total'] >= 1

import jwt
from collections import Counter

from app import app
from models import db, User, AssessmentResult
from routes.assessment import SAMPLE_QUESTIONS, DOMAINS


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


def build_assessment_payload(questions=None):
    if questions is None:
        questions = SAMPLE_QUESTIONS

    answers = {}
    option_map = {}
    for question in questions:
        question_id = question['id']
        answers[question_id] = question['correct_answer']
        option_map[question_id] = {
            'A': question['option_a'],
            'B': question['option_b'],
            'C': question['option_c'],
            'D': question['option_d'],
        }
    return answers, option_map


def build_assessment_payload_from_question_ids(question_ids):
    questions_by_id = {str(question['id']): question for question in SAMPLE_QUESTIONS}
    answers = {}
    option_map = {}
    for question_id in question_ids:
        normalized_id = str(question_id)
        question = questions_by_id[normalized_id]
        answers[normalized_id] = question['correct_answer']
        option_map[normalized_id] = {
            'A': question['option_a'],
            'B': question['option_b'],
            'C': question['option_c'],
            'D': question['option_d'],
        }
    return answers, option_map


def _domain_counts(questions):
    return Counter(question['domain'] for question in questions)


def test_assessment_questions_sample_exactly_three_per_domain(client):
    response = client.get('/api/assessment/questions')

    assert response.status_code == 200
    data = response.get_json()
    questions = data['questions']

    assert len(questions) == 15
    assert data['total_questions'] == 15
    assert len({question['id'] for question in questions}) == 15

    assert _domain_counts(questions) == Counter({domain: 3 for domain in DOMAINS})


def test_assessment_submit_persists_domain_scores(client):
    with app.app_context():
        user = create_user()
        secret = app.config['SUPABASE_JWT_SECRET']
        token = jwt.encode({'sub': user.id}, secret, algorithm='HS256')

    questions_response = client.get('/api/assessment/questions')
    assert questions_response.status_code == 200
    questions = questions_response.get_json()['questions']
    selected_question_ids = [str(question['id']) for question in questions]
    answers, option_map = build_assessment_payload_from_question_ids(selected_question_ids)

    response = client.post(
        '/api/assessment/submit',
        json={
            'answers': answers,
            'option_map': option_map,
            'selected_question_ids': selected_question_ids,
            'time_taken_minutes': 12
        },
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['saved'] is True
    assert 'domain_scores' in data
    assert data['max_score'] == 15
    assert data['total_score'] == 15
    assert data['domain_scores']['AI Fundamentals']['total'] == 3
    assert data['domain_scores']['Practical Usage']['total'] == 3
    assert data['domain_scores']['Ethics & Critical Thinking']['total'] == 3
    assert data['domain_scores']['AI Impact & Applications']['total'] == 3
    assert data['domain_scores']['Strategic Understanding']['total'] == 3

    with app.app_context():
        record = AssessmentResult.query.filter_by(user_id=user.id).first()
        assert record is not None
        assert isinstance(record.domain_scores, dict)
        assert record.max_score == 15
        assert record.total_score == 15
        assert 'Strategic Understanding' in record.domain_scores
        assert record.domain_scores['AI Fundamentals']['total'] == 3
        assert record.domain_scores['Practical Usage']['total'] == 3
        assert record.domain_scores['Ethics & Critical Thinking']['total'] == 3
        assert record.domain_scores['AI Impact & Applications']['total'] == 3
        assert record.domain_scores['Strategic Understanding']['total'] == 3

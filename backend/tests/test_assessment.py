from collections import Counter

from models import db, User, AssessmentResult
from routes.assessment import SAMPLE_QUESTIONS, DOMAINS
from auth_identity import SUPABASE_PROVIDER


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


def test_assessment_submit_persists_domain_scores(client, app, auth_headers):
    with app.app_context():
        user = create_user()
        headers = auth_headers(user)

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
        headers=headers
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


def test_assessment_submit_guest_returns_unsaved(client):
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
        },
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['saved'] is False


def test_assessment_recommendations_include_safe_training_metadata(client, app, auth_headers):
    with app.app_context():
        user = create_user(email='recommendation-metadata@example.com')
        db.session.add(AssessmentResult(
            user_id=user.id,
            total_score=3,
            max_score=15,
            percentage=20,
            domain_scores={
                'AI Fundamentals': {'score': 0, 'total': 3},
                'Practical Usage': {'score': 1, 'total': 3},
                'Ethics & Critical Thinking': {'score': 3, 'total': 3},
                'AI Impact & Applications': {'score': 3, 'total': 3},
                'Strategic Understanding': {'score': 3, 'total': 3},
            },
        ))
        db.session.commit()
        headers = auth_headers(user)

    response = client.get('/api/assessment/recommendations', headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    recommendations = data['recommendations']

    assert recommendations
    assert any(recommendation['has_internal_lessons'] for recommendation in recommendations)
    for recommendation in recommendations:
        assert 'target_domains' in recommendation
        assert 'lesson_count' in recommendation
        assert 'has_internal_lessons' in recommendation
        assert recommendation['start_path'].startswith(f"/training/modules/{recommendation['id']}")
        if recommendation['has_internal_lessons']:
            assert recommendation['lesson_count'] > 0
            assert recommendation['start_path'].endswith('/learn')


def test_assessment_submit_uses_local_user_linked_to_supabase_identity(client, app, create_supabase_token):
    supabase_subject = '00000000-0000-4000-8000-000000000123'

    with app.app_context():
        user = create_user(email='linked-supabase@example.com')
        user.auth_provider = SUPABASE_PROVIDER
        user.auth_subject = supabase_subject
        db.session.commit()
        local_user_id = user.id

    question_ids = [question['id'] for question in SAMPLE_QUESTIONS[:15]]
    answers, option_map = build_assessment_payload_from_question_ids(question_ids)
    token = create_supabase_token(sub=supabase_subject, email='linked-supabase@example.com')

    response = client.post(
        '/api/assessment/submit',
        json={
            'answers': answers,
            'option_map': option_map,
            'selected_question_ids': question_ids,
        },
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    assert response.get_json()['saved'] is True

    with app.app_context():
        record = AssessmentResult.query.filter_by(user_id=local_user_id).first()
        assert record is not None
        assert record.user_id == local_user_id
        assert record.user_id != supabase_subject


def test_course_recommendations_include_training_metadata_and_safe_routes(client, app, auth_headers):
    with app.app_context():
        user = create_user(email='recommendation-metadata@example.com')
        db.session.add(AssessmentResult(
            user_id=user.id,
            total_score=1,
            max_score=15,
            percentage=6.7,
            domain_scores={
                'Practical Usage': {'score': 0, 'total': 3},
                'AI Fundamentals': {'score': 3, 'total': 3},
            },
        ))
        db.session.commit()
        headers = auth_headers(user)

    response = client.get('/api/assessment/recommendations', headers=headers)

    assert response.status_code == 200
    payload = response.get_json()
    recommendations = payload['recommendations']

    assert recommendations
    assert payload['weak_domains'] == ['Practical Usage']
    assert any('Practical Usage' in rec['target_domains'] for rec in recommendations)

    for recommendation in recommendations:
        assert isinstance(recommendation['target_domains'], list)
        assert isinstance(recommendation['lesson_count'], int)
        assert isinstance(recommendation['has_internal_lessons'], bool)
        assert recommendation['detail_path'].startswith('/training/modules/')
        assert recommendation['route_path'].startswith('/training/modules/')
        assert recommendation['routing']['primary_path'] == recommendation['route_path']
        assert recommendation['routing']['detail_path'] == recommendation['detail_path']
        assert recommendation['routing']['has_internal_lessons'] == recommendation['has_internal_lessons']
        if recommendation['has_internal_lessons']:
            assert recommendation['learn_path'].endswith('/learn')
            assert recommendation['routing']['route_type'] == 'internal_lessons'
        else:
            assert recommendation['learn_path'] is None

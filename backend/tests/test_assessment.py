from collections import Counter
import json

from models import db, User, AssessmentResult
from routes.assessment import SAMPLE_QUESTIONS, DOMAINS, _recommended_difficulty
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


def _generated_question_payload():
    questions = []
    for domain in DOMAINS:
        for index in range(1, 4):
            questions.append({
                'domain': domain,
                'question_text': f'{domain} generated question {index}?',
                'option_a': f'Correct {domain} {index}',
                'option_b': f'Distractor B {domain} {index}',
                'option_c': f'Distractor C {domain} {index}',
                'option_d': f'Distractor D {domain} {index}',
                'correct_answer': 'A',
                'explanation': f'{domain} explanation {index}',
            })
    return {'questions': questions}


def _answers_for_generated_questions(questions):
    answers = {}
    for question in questions:
        for letter in ('A', 'B', 'C', 'D'):
            if question[f'option_{letter.lower()}'].startswith('Correct '):
                answers[question['id']] = letter
                break
    return answers


def test_assessment_questions_sample_exactly_three_per_domain(client):
    response = client.get('/api/assessment/questions')

    assert response.status_code == 200
    data = response.get_json()
    questions = data['questions']

    assert len(questions) == 15
    assert data['total_questions'] == 15
    assert len({question['id'] for question in questions}) == 15

    assert _domain_counts(questions) == Counter({domain: 3 for domain in DOMAINS})
    assert data['selected_question_ids'] == [str(question['id']) for question in questions]
    assert data['assessment_level'] == 'beginner'
    assert data['generation_source'] == 'curated_fallback'
    assert data['question_set_token'] is None
    assert all('correct_answer' not in question for question in questions)


def test_assessment_questions_respects_level_with_curated_fallback(client, monkeypatch):
    monkeypatch.delenv('OPENROUTER_API_KEY', raising=False)
    monkeypatch.delenv('OPENROUTER_MODEL', raising=False)
    monkeypatch.delenv('ASSESSMENT_QUESTION_SET_SECRET', raising=False)

    response = client.get('/api/assessment/questions?level=advanced')

    assert response.status_code == 200
    data = response.get_json()
    questions = data['questions']

    assert len(questions) == 15
    assert _domain_counts(questions) == Counter({domain: 3 for domain in DOMAINS})
    assert data['assessment_level'] == 'advanced'
    assert data['generation_source'] == 'curated_fallback'
    assert data['question_set_token'] is None
    assert all('correct_answer' not in question for question in questions)


def test_assessment_questions_falls_back_when_openrouter_output_invalid(client, monkeypatch):
    monkeypatch.setenv('OPENROUTER_API_KEY', 'test-openrouter-key')
    monkeypatch.setenv('OPENROUTER_MODEL', 'test/model')
    monkeypatch.setenv('ASSESSMENT_QUESTION_SET_SECRET', 'test-question-set-secret')

    def fake_completion(**kwargs):
        return {
            'choices': [
                {
                    'message': {
                        'content': json.dumps({'questions': []}),
                    },
                },
            ],
        }

    monkeypatch.setattr('routes.assessment._post_openrouter_chat_completion', fake_completion)

    response = client.get('/api/assessment/questions?level=intermediate')

    assert response.status_code == 200
    data = response.get_json()

    assert len(data['questions']) == 15
    assert data['assessment_level'] == 'intermediate'
    assert data['generation_source'] == 'curated_fallback'
    assert data['question_set_token'] is None


def test_generated_question_set_token_grades_and_persists_level(client, app, auth_headers, monkeypatch):
    monkeypatch.setenv('OPENROUTER_API_KEY', 'test-openrouter-key')
    monkeypatch.setenv('OPENROUTER_MODEL', 'test/model')
    monkeypatch.setenv('ASSESSMENT_QUESTION_SET_SECRET', 'test-question-set-secret')

    def fake_completion(**kwargs):
        return {
            'choices': [
                {
                    'message': {
                        'content': json.dumps(_generated_question_payload()),
                    },
                },
            ],
        }

    monkeypatch.setattr('routes.assessment._post_openrouter_chat_completion', fake_completion)

    with app.app_context():
        user = create_user(email='generated-assessment@example.com')
        headers = auth_headers(user)

    questions_response = client.get('/api/assessment/questions?level=intermediate')
    assert questions_response.status_code == 200
    question_set = questions_response.get_json()

    assert question_set['generation_source'] == 'openrouter'
    assert question_set['assessment_level'] == 'intermediate'
    assert question_set['question_set_token']
    assert len(question_set['questions']) == 15
    assert _domain_counts(question_set['questions']) == Counter({domain: 3 for domain in DOMAINS})
    assert all('correct_answer' not in question for question in question_set['questions'])

    answers = _answers_for_generated_questions(question_set['questions'])
    response = client.post(
        '/api/assessment/submit',
        json={
            'answers': answers,
            'selected_question_ids': question_set['selected_question_ids'],
            'assessment_level': 'intermediate',
            'question_set_token': question_set['question_set_token'],
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['total_score'] == 15
    assert data['max_score'] == 15
    assert data['assessment_level'] == 'intermediate'
    assert data['generation_source'] == 'openrouter'
    assert data['saved'] is True

    history_response = client.get('/api/assessment/history', headers=headers)
    assert history_response.status_code == 200
    assert history_response.get_json()['history'][0]['assessment_level'] == 'intermediate'

    with app.app_context():
        record = AssessmentResult.query.filter_by(user_id=user.id).first()
        assert record is not None
        assert record.assessment_level == 'intermediate'
        assert record.max_score == 15


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
            'assessment_level': 'advanced',
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
    assert data['assessment_level'] == 'advanced'
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
        assert record.assessment_level == 'advanced'
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


def test_assessment_submit_invalid_token_is_rejected(client):
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
            'question_set_token': 'invalid-token',
        },
    )

    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == 'Question set token is invalid or expired'


def test_assessment_recommendations_include_safe_training_metadata(client, app, auth_headers):
    with app.app_context():
        user = create_user(email='recommendation-metadata@example.com')
        db.session.add(AssessmentResult(
            user_id=user.id,
            total_score=3,
            max_score=15,
            percentage=20,
            assessment_level='beginner',
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
        assert recommendation['track'] in ['General', 'Sales', 'HR', 'Marketing', 'Operations']
        assert isinstance(recommendation['source_domains'], list)
        assert recommendation['next_action_label']
        assert recommendation['recommended_path'] == recommendation['start_path']
        assert 0.35 <= recommendation['confidence'] <= 0.98
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
            assessment_level='beginner',
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
        assert recommendation['track'] in ['General', 'Sales', 'HR', 'Marketing', 'Operations']
        assert isinstance(recommendation['source_domains'], list)
        assert recommendation['next_action_label']
        assert recommendation['recommended_path'] == recommendation['start_path']
        assert 0.35 <= recommendation['confidence'] <= 0.98
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


def test_course_recommendations_prioritize_profile_workplace_track(client, app, auth_headers):
    with app.app_context():
        user = create_user(email='sales-track@example.com')
        user.role = 'Sales'
        db.session.add(AssessmentResult(
            user_id=user.id,
            total_score=2,
            max_score=15,
            percentage=13.3,
            assessment_level='beginner',
            domain_scores={
                'Practical Usage': {'score': 0, 'total': 3},
                'AI Fundamentals': {'score': 2, 'total': 3},
                'Ethics & Critical Thinking': {'score': 3, 'total': 3},
                'AI Impact & Applications': {'score': 2, 'total': 3},
                'Strategic Understanding': {'score': 2, 'total': 3},
            },
        ))
        db.session.commit()
        headers = auth_headers(user)

    response = client.get('/api/assessment/recommendations', headers=headers)

    assert response.status_code == 200
    recommendations = response.get_json()['recommendations']

    assert recommendations[0]['id'] == 'module-ai-sales'
    assert recommendations[0]['track'] == 'Sales'
    assert recommendations[0]['source_domains'] == ['Practical Usage']
    assert recommendations[0]['next_action_label'] == 'Build certification readiness'


def test_assessment_level_influences_recommendation_difficulty():
    beginner_result = AssessmentResult(
        user_id='user-1',
        total_score=4,
        max_score=15,
        percentage=26.7,
        assessment_level='beginner',
    )
    advanced_result = AssessmentResult(
        user_id='user-2',
        total_score=4,
        max_score=15,
        percentage=26.7,
        assessment_level='advanced',
    )

    assert _recommended_difficulty(beginner_result) == 1
    assert _recommended_difficulty(advanced_result) == 2

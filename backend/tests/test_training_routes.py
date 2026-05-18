import json
import uuid
from datetime import datetime, timedelta

from models import db, Lesson, LessonProgress, User, UserProgress, TrainingModule


def create_user(email='training-tester@example.com'):
    user = User(
        email=email,
        password_hash='test-hash',
        first_name='Training',
        last_name='Tester',
        subscription_tier='free',
    )
    db.session.add(user)
    db.session.commit()
    return user


def is_playable_video_url(value):
    return isinstance(value, str) and (
        value.startswith('https://www.youtube-nocookie.com/embed/') or
        value.startswith('https://player.vimeo.com/video/') or
        value.endswith('.mp4') or
        value.endswith('.webm') or
        value.endswith('.ogg')
    )


PLACEHOLDER_VIDEO_MARKERS = [
    'media.w3.org',
    'interactive-examples.mdn.mozilla.net',
    'flower.mp4',
    'bunny',
    'sintel',
    'movie_300',
]


def assert_no_placeholder_video_url(value):
    assert isinstance(value, str)
    for marker in PLACEHOLDER_VIDEO_MARKERS:
        assert marker not in value


def test_training_progress_returns_summary_and_current_lesson_id(client, app, auth_headers):
    with app.app_context():
        user = create_user()
        module = TrainingModule.query.filter_by(id='module-ai-fundamentals-intro').first()
        lesson = Lesson.query.filter_by(module_id=module.id).order_by(Lesson.order_index).first()
        module_id = module.id
        lesson_id = lesson.id
        completed_module = TrainingModule.query.filter(TrainingModule.id != module.id).first()

        db.session.add_all([
            UserProgress(
                user_id=user.id,
                module_id=module_id,
                status='in_progress',
                progress_percentage=40,
                time_spent_minutes=35,
                current_lesson_id=lesson_id,
                started_at=datetime.utcnow() - timedelta(days=2),
                last_accessed=datetime.utcnow(),
            ),
            UserProgress(
                user_id=user.id,
                module_id=completed_module.id,
                status='completed',
                progress_percentage=100,
                time_spent_minutes=25,
                started_at=datetime.utcnow() - timedelta(days=4),
                completed_at=datetime.utcnow() - timedelta(days=1),
                last_accessed=datetime.utcnow() - timedelta(days=1),
            ),
        ])
        db.session.commit()
        headers = auth_headers(user)

    response = client.get('/api/training/progress', headers=headers)

    assert response.status_code == 200
    payload = response.get_json()
    progress_by_module = {entry['module_id']: entry for entry in payload['progress']}

    assert payload['summary']['completed_modules'] == 1
    assert payload['summary']['total_learning_time'] == 60
    assert payload['summary']['resume_module']['module_id'] == module_id
    assert progress_by_module[module_id]['current_lesson_id'] == lesson_id


def test_training_modules_returns_user_progress_inline(client, app, auth_headers):
    with app.app_context():
        user = create_user(email='inline-progress@example.com')
        module = TrainingModule.query.filter_by(id='module-ai-fundamentals-intro').first()
        module_id = module.id

        db.session.add(UserProgress(
            user_id=user.id,
            module_id=module_id,
            status='in_progress',
            progress_percentage=55,
            time_spent_minutes=18,
            last_accessed=datetime.utcnow(),
        ))
        db.session.commit()
        headers = auth_headers(user)

    response = client.get('/api/training/modules', headers=headers)

    assert response.status_code == 200
    payload = response.get_json()
    modules_by_id = {module['id']: module for module in payload['modules']}

    assert payload['resume_module']['module_id'] == module_id
    assert modules_by_id[module_id]['user_progress']['status'] == 'in_progress'
    assert modules_by_id[module_id]['user_progress']['progress_percentage'] == 55


def test_training_modules_include_safe_routing_metadata(client):
    response = client.get('/api/training/modules')

    assert response.status_code == 200
    payload = response.get_json()
    modules_by_id = {module['id']: module for module in payload['modules']}
    sales_module = modules_by_id['module-ai-sales']

    assert sales_module['target_domains'] == ['Practical Usage', 'AI Impact & Applications']
    assert sales_module['lesson_count'] >= 1
    assert sales_module['has_internal_lessons'] is True
    assert sales_module['start_path'] == '/training/modules/module-ai-sales/learn'
    assert sales_module['content_url'].startswith('https://www.youtube-nocookie.com/embed/')
    assert_no_placeholder_video_url(sales_module['content_url'])
    assert sales_module['metadata']['video_title']
    assert sales_module['metadata']['attribution']


def test_training_module_detail_returns_authenticated_progress(client, app, auth_headers):
    with app.app_context():
        user = create_user(email='module-detail@example.com')
        module = TrainingModule.query.filter_by(id='module-ai-fundamentals-intro').first()
        lesson = Lesson.query.filter_by(module_id=module.id).order_by(Lesson.order_index).first()
        module_id = module.id
        lesson_id = lesson.id

        db.session.add(UserProgress(
            user_id=user.id,
            module_id=module_id,
            status='in_progress',
            progress_percentage=25,
            time_spent_minutes=12,
            current_lesson_id=lesson_id,
            last_accessed=datetime.utcnow(),
        ))
        db.session.commit()
        headers = auth_headers(user)

    response = client.get(f'/api/training/modules/{module_id}', headers=headers)

    assert response.status_code == 200
    payload = response.get_json()

    assert payload['module']['progress']['progress_percentage'] == 25
    assert payload['module']['progress']['current_lesson_id'] == lesson_id


def test_training_module_serializers_expose_lesson_and_routing_metadata(client):
    response = client.get('/api/training/modules')

    assert response.status_code == 200
    modules_by_id = {
        module['id']: module
        for module in response.get_json()['modules']
    }

    sales_module = modules_by_id['module-ai-sales']
    assert sales_module['target_domains'] == ['Practical Usage', 'AI Impact & Applications']
    assert sales_module['lesson_count'] >= 1
    assert sales_module['has_internal_lessons'] is True
    assert sales_module['learn_path'] == '/training/modules/module-ai-sales/learn'
    assert sales_module['route_path'] == sales_module['learn_path']
    assert sales_module['routing']['route_type'] == 'internal_lessons'
    assert_no_placeholder_video_url(sales_module['content_url'])

    external_module = modules_by_id['module-google-ai-essentials']
    assert external_module['target_domains'] == ['AI Fundamentals', 'Practical Usage']
    assert external_module['lesson_count'] == 0
    assert external_module['has_internal_lessons'] is False
    assert external_module['learn_path'] is None
    assert external_module['route_path'] == '/training/modules/module-google-ai-essentials'
    assert external_module['routing']['route_type'] == 'external_detail'
    assert external_module['external_url'].startswith('https://')


def test_completing_lesson_rolls_up_module_progress(client, app, auth_headers):
    with app.app_context():
        user = create_user(email='lesson-rollup@example.com')
        module = TrainingModule.query.filter_by(id='module-ai-fundamentals-intro').first()
        lessons = Lesson.query.filter_by(module_id=module.id).order_by(Lesson.order_index).all()
        headers = auth_headers(user)

    response = client.post(
        f'/api/course/lessons/{lessons[0].id}/complete',
        headers=headers,
        json={'time_spent_minutes': 14},
    )

    assert response.status_code == 200

    with app.app_context():
        module_progress = UserProgress.query.filter_by(user_id=user.id, module_id=module.id).first()

        assert module_progress is not None
        assert module_progress.progress_percentage == int((1 / len(lessons)) * 100)
        assert module_progress.time_spent_minutes == 14
        assert module_progress.current_lesson_id == lessons[1].id


def test_course_module_lessons_returns_module_progress_summary(client, app, auth_headers):
    with app.app_context():
        user = create_user(email='module-progress-summary@example.com')
        module = TrainingModule.query.filter_by(id='module-ai-fundamentals-intro').first()
        lessons = Lesson.query.filter_by(module_id=module.id).order_by(Lesson.order_index).all()
        module_id = module.id
        lesson_count = len(lessons)
        second_lesson_id = lessons[1].id

        db.session.add(LessonProgress(
            id=str(uuid.uuid4()),
            user_id=user.id,
            lesson_id=lessons[0].id,
            module_id=module_id,
            status='completed',
            time_spent_minutes=9,
            started_at=datetime.utcnow() - timedelta(hours=1),
            completed_at=datetime.utcnow(),
            last_accessed=datetime.utcnow(),
        ))
        db.session.add(UserProgress(
            user_id=user.id,
            module_id=module_id,
            status='in_progress',
            progress_percentage=int((1 / lesson_count) * 100),
            time_spent_minutes=9,
            current_lesson_id=second_lesson_id,
            started_at=datetime.utcnow() - timedelta(hours=1),
            last_accessed=datetime.utcnow(),
        ))
        db.session.commit()
        headers = auth_headers(user)

    response = client.get(f'/api/course/modules/{module_id}/lessons', headers=headers)

    assert response.status_code == 200
    payload = response.get_json()

    assert payload['module_progress']['completed_lessons'] == 1
    assert payload['module_progress']['total_lessons'] == lesson_count
    assert payload['module_progress']['resume_lesson_id'] == second_lesson_id
    assert payload['module_progress']['current_lesson_id'] == second_lesson_id


def test_course_video_lesson_returns_normalized_playable_url(client, app, auth_headers):
    with app.app_context():
        user = create_user(email='video-lesson@example.com')
        lesson = Lesson.query.filter_by(module_id='module-ai-sales', content_type='video').first()
        headers = auth_headers(user)

    response = client.get(f'/api/course/lessons/{lesson.id}', headers=headers)

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['content_type'] == 'video'
    assert is_playable_video_url(payload['content']['video_url'])
    assert_no_placeholder_video_url(payload['content']['video_url'])
    assert payload['content']['video_title']
    assert payload['content']['creator']
    assert payload['content']['original_url'].startswith('https://www.youtube.com/watch?v=')
    assert payload['content']['attribution']
    assert payload['progress']['status'] == 'in_progress'


def test_seeded_internal_video_modules_have_playable_video_lessons(client, app, auth_headers):
    module_ids = [
        'module-ai-sales',
        'module-ethical-hr',
        'module-marketing-ai',
        'module-ops-ai',
    ]

    with app.app_context():
        user = create_user(email='video-lessons@example.com')
        headers = auth_headers(user)

        for module_id in module_ids:
            lessons = Lesson.query.filter_by(
                module_id=module_id,
                content_type='video',
            ).all()
            assert lessons, f'{module_id} should have at least one video lesson'

            for lesson in lessons:
                content = json.loads(lesson.content)
                assert is_playable_video_url(content['video_url'])
                assert_no_placeholder_video_url(content['video_url'])
                assert content['video_title']
                assert content['creator']
                assert content['original_url'].startswith('https://www.youtube.com/watch?v=')
                assert content['attribution']
                assert content['curation_note']

        sales_lesson = Lesson.query.filter_by(
            module_id='module-ai-sales',
            content_type='video',
        ).first()
        sales_lesson_id = sales_lesson.id

    lessons_response = client.get('/api/course/modules/module-ai-sales/lessons', headers=headers)
    assert lessons_response.status_code == 200
    lessons_payload = lessons_response.get_json()
    video_summary = next(lesson for lesson in lessons_payload['lessons'] if lesson['id'] == sales_lesson_id)

    assert lessons_payload['module']['has_internal_lessons'] is True
    assert lessons_payload['module']['lesson_count'] >= 1
    assert video_summary['has_video_url'] is True
    assert is_playable_video_url(video_summary['video_url'])
    assert_no_placeholder_video_url(video_summary['video_url'])

    lesson_response = client.get(f'/api/course/lessons/{sales_lesson_id}', headers=headers)
    assert lesson_response.status_code == 200
    lesson_payload = lesson_response.get_json()
    assert lesson_payload['content_type'] == 'video'
    assert is_playable_video_url(lesson_payload['content']['video_url'])
    assert_no_placeholder_video_url(lesson_payload['content']['video_url'])


def test_seeded_workplace_track_modules_include_scenario_quizzes(client, app):
    module_ids = [
        'module-ai-sales',
        'module-ethical-hr',
        'module-marketing-ai',
        'module-ops-ai',
    ]

    with app.app_context():
        for module_id in module_ids:
            quiz = Lesson.query.filter_by(module_id=module_id, content_type='quiz').first()
            assert quiz is not None, f'{module_id} should include a scenario quiz'

            content = json.loads(quiz.content)
            assert content['passing_score'] == 80
            assert len(content['questions']) >= 6
            assert any('AI' in question['question'] for question in content['questions'])

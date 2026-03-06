import jwt
import uuid
from datetime import datetime, timedelta

from app import app
from models import db, Lesson, LessonProgress, User, UserProgress, TrainingModule
from seeders.course_content import seed_course_content


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


def create_auth_header(user_id):
    secret = app.config['SUPABASE_JWT_SECRET']
    token = jwt.encode({'sub': user_id}, secret, algorithm='HS256')
    return {'Authorization': f'Bearer {token}'}


def seed_course_data():
    seed_course_content(force=True, silent=True)


def test_training_progress_returns_summary_and_current_lesson_id(client):
    with app.app_context():
        seed_course_data()
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
        headers = create_auth_header(user.id)

    response = client.get('/api/training/progress', headers=headers)

    assert response.status_code == 200
    payload = response.get_json()
    progress_by_module = {entry['module_id']: entry for entry in payload['progress']}

    assert payload['summary']['completed_modules'] == 1
    assert payload['summary']['total_learning_time'] == 60
    assert payload['summary']['resume_module']['module_id'] == module_id
    assert progress_by_module[module_id]['current_lesson_id'] == lesson_id


def test_training_modules_returns_user_progress_inline(client):
    with app.app_context():
        seed_course_data()
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
        headers = create_auth_header(user.id)

    response = client.get('/api/training/modules', headers=headers)

    assert response.status_code == 200
    payload = response.get_json()
    modules_by_id = {module['id']: module for module in payload['modules']}

    assert payload['resume_module']['module_id'] == module_id
    assert modules_by_id[module_id]['user_progress']['status'] == 'in_progress'
    assert modules_by_id[module_id]['user_progress']['progress_percentage'] == 55


def test_training_module_detail_returns_authenticated_progress(client):
    with app.app_context():
        seed_course_data()
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
        headers = create_auth_header(user.id)

    response = client.get(f'/api/training/modules/{module_id}', headers=headers)

    assert response.status_code == 200
    payload = response.get_json()

    assert payload['module']['progress']['progress_percentage'] == 25
    assert payload['module']['progress']['current_lesson_id'] == lesson_id


def test_completing_lesson_rolls_up_module_progress(client):
    with app.app_context():
        seed_course_data()
        user = create_user(email='lesson-rollup@example.com')
        module = TrainingModule.query.filter_by(id='module-ai-fundamentals-intro').first()
        lessons = Lesson.query.filter_by(module_id=module.id).order_by(Lesson.order_index).all()
        headers = create_auth_header(user.id)

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


def test_course_module_lessons_returns_module_progress_summary(client):
    with app.app_context():
        seed_course_data()
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
        headers = create_auth_header(user.id)

    response = client.get(f'/api/course/modules/{module_id}/lessons', headers=headers)

    assert response.status_code == 200
    payload = response.get_json()

    assert payload['module_progress']['completed_lessons'] == 1
    assert payload['module_progress']['total_lessons'] == lesson_count
    assert payload['module_progress']['resume_lesson_id'] == second_lesson_id
    assert payload['module_progress']['current_lesson_id'] == second_lesson_id

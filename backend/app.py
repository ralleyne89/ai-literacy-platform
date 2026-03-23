import os
from datetime import datetime

import click
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask.cli import with_appcontext
from flask_cors import CORS
from flask_migrate import Migrate

from logging_config import configure_logging
from models import TrainingModule, db
from schema_readiness import (
    SchemaReadinessError,
    should_enforce_schema_readiness,
    validate_signup_schema_or_raise,
)
from seeders.certifications import seed_certification_types as seed_certification_types_fixture
from seeders.course_content import seed_course_content as seed_course_content_fixture
from seeders.training import seed_training_modules as seed_training_modules_fixture


load_dotenv()
configure_logging()

migrate = Migrate()


def _normalize_setting(value):
    if value is None:
        return ''
    return str(value).strip()


def _resolve_setting(primary_key, *fallback_keys):
    for key in (primary_key, *fallback_keys):
        value = _normalize_setting(os.getenv(key))
        if value:
            return value
    return ''


def _normalize_origin(value):
    return str(value or '').strip().rstrip('/')


def _build_allowed_origins():
    frontend_url = os.getenv('FRONTEND_URL', '').strip()
    allowed_origins_env = os.getenv('ALLOWED_ORIGINS', '')

    origins = []
    for value in (frontend_url, *[origin for origin in allowed_origins_env.split(',') if origin.strip()]):
        normalized = _normalize_origin(value)
        if normalized and normalized not in origins:
            origins.append(normalized)

    environment = (os.getenv('FLASK_ENV') or os.getenv('ENV') or '').lower()
    if environment not in ('production', 'prod'):
        for local_origin in (
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001',
        ):
            normalized = _normalize_origin(local_origin)
            if normalized and normalized not in origins:
                origins.append(normalized)

    return origins


def _configure_app(app: Flask, test_config=None):
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///ai_literacy.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['CLERK_SECRET_KEY'] = _resolve_setting('CLERK_SECRET_KEY')
    app.config['CLERK_JWT_ISSUER'] = _resolve_setting('CLERK_JWT_ISSUER')
    app.config['CLERK_JWKS_URL'] = _resolve_setting('CLERK_JWKS_URL')
    app.config['CLERK_API_URL'] = _resolve_setting('CLERK_API_URL')

    if test_config:
        app.config.update(test_config)


def _register_extensions(app: Flask):
    db.init_app(app)
    migrate.init_app(app, db)

    allowed_origins = _build_allowed_origins()
    has_specific_origins = bool(allowed_origins)
    CORS(
        app,
        resources={r'/api/*': {'origins': allowed_origins if has_specific_origins else ['*']}},
        supports_credentials=has_specific_origins,
        send_wildcard=not has_specific_origins,
        methods=['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allow_headers=[
            'Content-Type',
            'Authorization',
            'Accept',
            'Origin',
            'X-Requested-With',
            'Cache-Control',
        ],
        expose_headers=['Content-Type', 'Authorization'],
        max_age=86400,
        automatic_options=True,
    )


def _register_blueprints(app: Flask):
    from routes.auth import auth_bp
    from routes.assessment import assessment_bp
    from routes.training import training_bp
    from routes.certification import certification_bp
    from routes.billing import billing_bp
    from routes.course_content import course_content_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(assessment_bp, url_prefix='/api/assessment')
    app.register_blueprint(training_bp, url_prefix='/api/training')
    app.register_blueprint(certification_bp, url_prefix='/api/certification')
    app.register_blueprint(billing_bp, url_prefix='/api/billing')
    app.register_blueprint(course_content_bp, url_prefix='/api/course')


def _register_cli(app: Flask):
    @app.cli.command('seed-training-modules')
    @click.option('--force', is_flag=True, help='Update existing modules with fixture data')
    @click.option('--silent', is_flag=True, help='Suppress console output')
    @with_appcontext
    def seed_training_modules_command(force: bool, silent: bool):
        seed_training_modules_fixture(force=force, silent=silent)

    @app.cli.command('seed-certifications')
    @click.option('--force', is_flag=True, help='Update existing certification entries with fixture data')
    @click.option('--silent', is_flag=True, help='Suppress console output')
    @with_appcontext
    def seed_certifications_command(force: bool, silent: bool):
        seed_certification_types_fixture(force=force, silent=silent)

    @app.cli.command('seed-course-content')
    @click.option('--force', is_flag=True, help='Update existing course content with fixture data')
    @click.option('--silent', is_flag=True, help='Suppress console output')
    @with_appcontext
    def seed_course_content_command(force: bool, silent: bool):
        seed_course_content_fixture(force=force, silent=silent)


def _register_routes(app: Flask):
    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

    @app.route('/api/stats')
    def platform_stats():
        try:
            from models import AssessmentResult, Certification, User

            return jsonify({
                'total_users': User.query.count(),
                'total_assessments': AssessmentResult.query.count(),
                'total_certifications': Certification.query.count(),
                'completion_rate': 85,
                'average_transformation_weeks': 3,
                'satisfaction_rating': 4.8,
            })
        except Exception as exc:
            return jsonify({'error': str(exc)}), 500


def _register_before_request_hooks(app: Flask):
    @app.before_request
    def _ensure_runtime_ready():
        if not app.config.get('_schema_readiness_checked'):
            try:
                _enforce_startup_schema_readiness(app)
            except SchemaReadinessError as exc:
                app.logger.critical('startup_schema_readiness_check_failed: %s', exc)
                return jsonify({'error': 'Application schema is not ready.'}), 503
            app.config['_schema_readiness_checked'] = True

        if app.config.get('_training_seed_ensured'):
            return

        environment = (os.getenv('FLASK_ENV') or os.getenv('ENV') or '').lower()
        if app.config.get('TESTING') or environment in ('production', 'prod'):
            app.config['_training_seed_ensured'] = True
            return

        try:
            if TrainingModule.query.count() == 0:
                seed_training_modules_fixture(force=False, silent=True)
        except Exception:
            pass

        app.config['_training_seed_ensured'] = True


def _enforce_startup_schema_readiness(app: Flask) -> None:
    if app.config.get('TESTING'):
        app.logger.info('startup_schema_readiness_check_skipped_for_testing')
        return

    if not should_enforce_schema_readiness():
        app.logger.info('startup_schema_readiness_check_skipped')
        return

    with app.app_context():
        validate_signup_schema_or_raise(db)

    app.logger.info('startup_schema_readiness_check_passed')


def create_app(test_config=None):
    app = Flask(__name__)
    _configure_app(app, test_config=test_config)
    _register_extensions(app)
    _register_blueprints(app)
    _register_cli(app)
    _register_routes(app)
    _register_before_request_hooks(app)

    return app


app = create_app()


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        environment = (os.getenv('FLASK_ENV') or os.getenv('ENV') or '').lower()
        if environment not in ('production', 'prod') and TrainingModule.query.count() == 0:
            seed_training_modules_fixture(force=False, silent=True)

    port = int(os.getenv('PORT', 5001))
    debug_mode = os.getenv('FLASK_DEBUG', 'True').lower() in ('1', 'true', 'yes')
    host = os.getenv('HOST', '0.0.0.0')
    app.run(debug=debug_mode, port=port, host=host)

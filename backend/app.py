from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_migrate import Migrate
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import bcrypt
import click
from flask.cli import with_appcontext
from logging_config import configure_logging
from schema_readiness import (
    SchemaReadinessError,
    should_enforce_schema_readiness,
    validate_signup_schema_or_raise,
)

load_dotenv()
configure_logging()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///ai_literacy.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


def _resolve_jwt_secret():
    supabase_jwt_secret = os.getenv('SUPABASE_JWT_SECRET')
    jwt_secret = os.getenv('JWT_SECRET_KEY')
    if supabase_jwt_secret or jwt_secret:
        return supabase_jwt_secret or jwt_secret

    app_env = (os.getenv('FLASK_ENV') or os.getenv('ENV') or '').lower()
    if app_env in ('production', 'prod'):
        raise RuntimeError('SUPABASE_JWT_SECRET or JWT_SECRET_KEY must be configured in production')

    return 'jwt-secret-change-in-production'


def _normalize_setting(value):
    if value is None:
        return ''
    return str(value).strip()


def _resolve_auth0_setting(primary_key, fallback_key):
    primary_value = _normalize_setting(os.getenv(primary_key))
    if primary_value:
        return primary_value

    return _normalize_setting(os.getenv(fallback_key))


app.config['JWT_SECRET_KEY'] = _resolve_jwt_secret()
app.config['AUTH0_DOMAIN'] = _resolve_auth0_setting('AUTH0_DOMAIN', 'VITE_AUTH0_DOMAIN')
app.config['AUTH0_CLIENT_ID'] = _resolve_auth0_setting('AUTH0_CLIENT_ID', 'VITE_AUTH0_CLIENT_ID')
app.config['AUTH0_AUDIENCE'] = _resolve_auth0_setting('AUTH0_AUDIENCE', 'VITE_AUTH0_AUDIENCE')
app.config['AUTH0_REDIRECT_URI'] = _resolve_auth0_setting('AUTH0_REDIRECT_URI', 'VITE_AUTH0_REDIRECT_URI')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
from models import db
db.init_app(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)
frontend_url = os.getenv('FRONTEND_URL', '').strip()
allowed_origins_env = os.getenv('ALLOWED_ORIGINS', '')


def _normalize_origin(value):
    origin = str(value or '').strip().rstrip('/')
    return origin


def _build_allowed_origins():
    origins = []
    for value in (frontend_url, *[origin for origin in allowed_origins_env.split(',') if origin.strip()]):
        normalized = _normalize_origin(value)
        if not normalized:
            continue
        if normalized not in origins:
            origins.append(normalized)

    environment = (os.getenv('FLASK_ENV') or os.getenv('ENV') or '').lower()
    if environment not in ('production', 'prod'):
        for local_origin in ('http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'):
            normalized_local_origin = _normalize_origin(local_origin)
            if normalized_local_origin and normalized_local_origin not in origins:
                origins.append(normalized_local_origin)

    return origins


ALLOWED_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
ALLOWED_HEADERS = [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
    'Cache-Control',
]
EXPOSE_HEADERS = ['Content-Type', 'Authorization']

allowed_origins = _build_allowed_origins()
has_specific_origins = bool(allowed_origins)
cors_options = {
    'resources': {r'/api/*': {'origins': allowed_origins if has_specific_origins else ['*']}},
    'supports_credentials': has_specific_origins,
    'send_wildcard': not has_specific_origins,
    'methods': ALLOWED_METHODS,
    'allow_headers': ALLOWED_HEADERS,
    'expose_headers': EXPOSE_HEADERS,
    'max_age': 86400,
    'automatic_options': True,
}

CORS(app, **cors_options)

# Import models and routes after app initialization
# This will be done after db initialization to avoid circular imports

# Import and register blueprints after app initialization
from routes.auth import auth_bp
from routes.assessment import assessment_bp
from routes.training import training_bp
from routes.certification import certification_bp
from routes.billing import billing_bp
from routes.course_content import course_content_bp
from seeders.training import seed_training_modules as seed_training_modules_fixture
from seeders.certifications import seed_certification_types as seed_certification_types_fixture
from seeders.course_content import seed_course_content as seed_course_content_fixture

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(assessment_bp, url_prefix='/api/assessment')
app.register_blueprint(training_bp, url_prefix='/api/training')
app.register_blueprint(certification_bp, url_prefix='/api/certification')
app.register_blueprint(billing_bp, url_prefix='/api/billing')
app.register_blueprint(course_content_bp, url_prefix='/api/course')


def _enforce_startup_schema_readiness() -> None:
    if not should_enforce_schema_readiness():
        app.logger.info('startup_schema_readiness_check_skipped')
        return

    with app.app_context():
        validate_signup_schema_or_raise(db)

    app.logger.info('startup_schema_readiness_check_passed')


try:
    _enforce_startup_schema_readiness()
except SchemaReadinessError as exc:
    app.logger.critical('startup_schema_readiness_check_failed: %s', exc)
    raise


@app.cli.command('seed-training-modules')
@click.option('--force', is_flag=True, help='Update existing modules with fixture data')
@click.option('--silent', is_flag=True, help='Suppress console output')
@with_appcontext
def seed_training_modules_command(force: bool, silent: bool):
    """Seed the training module catalog with curated defaults."""
    seed_training_modules_fixture(force=force, silent=silent)


@app.cli.command('seed-certifications')
@click.option('--force', is_flag=True, help='Update existing certification entries with fixture data')
@click.option('--silent', is_flag=True, help='Suppress console output')
@with_appcontext
def seed_certifications_command(force: bool, silent: bool):
    """Seed the certification catalog with curated defaults."""
    seed_certification_types_fixture(force=force, silent=silent)


@app.cli.command('seed-course-content')
@click.option('--force', is_flag=True, help='Update existing course content with fixture data')
@click.option('--silent', is_flag=True, help='Suppress console output')
@with_appcontext
def seed_course_content_command(force: bool, silent: bool):
    """Seed the course lesson catalog with curated defaults."""
    seed_course_content_fixture(force=force, silent=silent)


@app.cli.command('migrate-add-target-domains')
@with_appcontext
def migrate_add_target_domains():
    """Add target_domains column to training_module table"""
    from sqlalchemy import text
    try:
        # Check if column already exists
        inspector = db.inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('training_module')]

        if 'target_domains' in columns:
            print("✅ Column 'target_domains' already exists in training_module table")
            return

        # Add the column
        with db.engine.connect() as conn:
            conn.execute(text(
                "ALTER TABLE training_module ADD COLUMN target_domains TEXT"
            ))
            conn.commit()

        print("✅ Successfully added 'target_domains' column to training_module table")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise


@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/stats')
def platform_stats():
    """Get platform statistics for homepage"""
    try:
        from models import User, AssessmentResult, Certification
        total_users = User.query.count()
        total_assessments = AssessmentResult.query.count()
        total_certifications = Certification.query.count()
        
        # Calculate average completion rate (mock data for now)
        completion_rate = 85
        
        return jsonify({
            'total_users': total_users,
            'total_assessments': total_assessments,
            'total_certifications': total_certifications,
            'completion_rate': completion_rate,
            'average_transformation_weeks': 3,
            'satisfaction_rating': 4.8
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.getenv('PORT', 5001))
    debug_mode = os.getenv('FLASK_DEBUG', 'True').lower() in ('1', 'true', 'yes')
    host = os.getenv('HOST', '0.0.0.0')
    app.run(debug=debug_mode, port=port, host=host)

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

load_dotenv()
configure_logging()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///ai_literacy.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
supabase_jwt_secret = os.getenv('SUPABASE_JWT_SECRET')
app.config['JWT_SECRET_KEY'] = supabase_jwt_secret or os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
from models import db
db.init_app(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)
CORS(app)

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

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(assessment_bp, url_prefix='/api/assessment')
app.register_blueprint(training_bp, url_prefix='/api/training')
app.register_blueprint(certification_bp, url_prefix='/api/certification')
app.register_blueprint(billing_bp, url_prefix='/api/billing')
app.register_blueprint(course_content_bp, url_prefix='/api/course')


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

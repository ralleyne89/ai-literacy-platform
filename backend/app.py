from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_migrate import Migrate
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///ai_literacy.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
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

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(assessment_bp, url_prefix='/api/assessment')
app.register_blueprint(training_bp, url_prefix='/api/training')
app.register_blueprint(certification_bp, url_prefix='/api/certification')

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
    app.run(debug=True, port=5001)

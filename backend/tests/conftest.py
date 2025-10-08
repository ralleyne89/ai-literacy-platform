import pytest

from app import app
from models import db
from seeders.training import seed_training_modules
from seeders.certifications import seed_certification_types


@pytest.fixture()
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SUPABASE_JWT_SECRET'] = 'test-supabase-secret'
    app.config['JWT_SECRET_KEY'] = 'test-jwt-secret'

    with app.app_context():
        db.drop_all()
        db.create_all()
        seed_training_modules(force=True, silent=True)
        seed_certification_types(force=True, silent=True)

        yield app.test_client()

        db.session.remove()
        db.drop_all()

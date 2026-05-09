"""Add assessment level to assessment results."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = '2293b1e30038'
down_revision = '2293b1e30037'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    assessment_result_columns = {column['name'] for column in inspector.get_columns('assessment_result')}

    if 'assessment_level' not in assessment_result_columns:
        op.add_column(
            'assessment_result',
            sa.Column('assessment_level', sa.String(length=20), nullable=True, server_default='beginner'),
        )


def downgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    assessment_result_columns = {column['name'] for column in inspector.get_columns('assessment_result')}

    if 'assessment_level' in assessment_result_columns:
        op.drop_column('assessment_result', 'assessment_level')

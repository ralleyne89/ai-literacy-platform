"""Add course content tables and training progress fields."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = '2293b1e30037'
down_revision = '2293b1e30036'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    table_names = set(inspector.get_table_names())

    if 'lesson' not in table_names:
        op.create_table(
            'lesson',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('module_id', sa.String(length=36), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('order_index', sa.Integer(), nullable=False),
            sa.Column('content_type', sa.String(length=50), nullable=False),
            sa.Column('content', sa.Text(), nullable=True),
            sa.Column('estimated_duration_minutes', sa.Integer(), nullable=True, server_default='10'),
            sa.Column('is_required', sa.Boolean(), nullable=True, server_default=sa.text('1')),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['module_id'], ['training_module.id']),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_lesson_module_id', 'lesson', ['module_id'])

    if 'lesson_progress' not in table_names:
        op.create_table(
            'lesson_progress',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('lesson_id', sa.String(length=36), nullable=False),
            sa.Column('module_id', sa.String(length=36), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=True, server_default='not_started'),
            sa.Column('time_spent_minutes', sa.Integer(), nullable=True, server_default='0'),
            sa.Column('quiz_score', sa.Integer(), nullable=True),
            sa.Column('quiz_attempts', sa.Integer(), nullable=True, server_default='0'),
            sa.Column('started_at', sa.DateTime(), nullable=True),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
            sa.Column('last_accessed', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['lesson_id'], ['lesson.id']),
            sa.ForeignKeyConstraint(['module_id'], ['training_module.id']),
            sa.ForeignKeyConstraint(['user_id'], ['user.id']),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', 'lesson_id', name='unique_user_lesson'),
        )
        op.create_index('idx_lesson_progress_user_id', 'lesson_progress', ['user_id'])
        op.create_index('idx_lesson_progress_lesson_id', 'lesson_progress', ['lesson_id'])
        op.create_index('idx_lesson_progress_module_id', 'lesson_progress', ['module_id'])

    user_progress_columns = {column['name'] for column in inspector.get_columns('user_progress')}
    if 'current_lesson_id' not in user_progress_columns:
        op.add_column('user_progress', sa.Column('current_lesson_id', sa.String(length=36), nullable=True))

    training_module_columns = {column['name'] for column in inspector.get_columns('training_module')}
    if 'target_domains' not in training_module_columns:
        op.add_column('training_module', sa.Column('target_domains', sa.Text(), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = inspect(bind)

    training_module_columns = {column['name'] for column in inspector.get_columns('training_module')}
    if 'target_domains' in training_module_columns:
        op.drop_column('training_module', 'target_domains')

    user_progress_columns = {column['name'] for column in inspector.get_columns('user_progress')}
    if 'current_lesson_id' in user_progress_columns:
        op.drop_column('user_progress', 'current_lesson_id')

    if 'lesson_progress' in inspector.get_table_names():
        op.drop_index('idx_lesson_progress_module_id', table_name='lesson_progress')
        op.drop_index('idx_lesson_progress_lesson_id', table_name='lesson_progress')
        op.drop_index('idx_lesson_progress_user_id', table_name='lesson_progress')
        op.drop_table('lesson_progress')

    if 'lesson' in inspector.get_table_names():
        op.drop_index('idx_lesson_module_id', table_name='lesson')
        op.drop_table('lesson')

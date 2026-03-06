"""Add external auth identity columns to user"""

revision = '2293b1e30036'
down_revision = '2293b1e30035'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('user', sa.Column('auth_provider', sa.String(length=32), nullable=True))
    op.add_column('user', sa.Column('auth_subject', sa.String(length=255), nullable=True))
    op.create_unique_constraint(
        'uq_user_auth_provider_subject',
        'user',
        ['auth_provider', 'auth_subject'],
    )


def downgrade():
    op.drop_constraint('uq_user_auth_provider_subject', 'user', type_='unique')
    op.drop_column('user', 'auth_subject')
    op.drop_column('user', 'auth_provider')

"""Add external auth identity columns to user"""

revision = '2293b1e30036'
down_revision = '2293b1e30035'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    with op.batch_alter_table('user', recreate='always') as batch_op:
        batch_op.add_column(sa.Column('auth_provider', sa.String(length=32), nullable=True))
        batch_op.add_column(sa.Column('auth_subject', sa.String(length=255), nullable=True))
        batch_op.create_unique_constraint(
            'uq_user_auth_provider_subject',
            ['auth_provider', 'auth_subject'],
        )


def downgrade():
    with op.batch_alter_table('user', recreate='always') as batch_op:
        batch_op.drop_constraint('uq_user_auth_provider_subject', type_='unique')
        batch_op.drop_column('auth_subject')
        batch_op.drop_column('auth_provider')

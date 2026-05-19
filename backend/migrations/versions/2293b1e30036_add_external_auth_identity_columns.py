"""Add external auth identity columns to user"""

revision = '2293b1e30036'
down_revision = '2293b1e30035'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name == 'sqlite':
        with op.batch_alter_table('user') as batch_op:
            batch_op.add_column(sa.Column('auth_provider', sa.String(length=32), nullable=True))
            batch_op.add_column(sa.Column('auth_subject', sa.String(length=255), nullable=True))
            batch_op.create_unique_constraint(
                'uq_user_auth_provider_subject',
                ['auth_provider', 'auth_subject'],
            )
        return

    op.add_column('user', sa.Column('auth_provider', sa.String(length=32), nullable=True))
    op.add_column('user', sa.Column('auth_subject', sa.String(length=255), nullable=True))
    op.create_unique_constraint(
        'uq_user_auth_provider_subject',
        'user',
        ['auth_provider', 'auth_subject'],
    )


def downgrade():
    bind = op.get_bind()
    if bind.dialect.name == 'sqlite':
        with op.batch_alter_table('user') as batch_op:
            batch_op.drop_constraint('uq_user_auth_provider_subject', type_='unique')
            batch_op.drop_column('auth_subject')
            batch_op.drop_column('auth_provider')
        return

    op.drop_constraint('uq_user_auth_provider_subject', 'user', type_='unique')
    op.drop_column('user', 'auth_subject')
    op.drop_column('user', 'auth_provider')

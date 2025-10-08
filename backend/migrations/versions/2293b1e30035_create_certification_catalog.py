"""Create certification catalog table and link earned certifications"""

revision = '2293b1e30035'
down_revision = '2293b1e30034'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


CERT_TYPE_TABLE = 'certification_type'
CERT_TABLE = 'certification'


def upgrade():
    op.create_table(
        CERT_TYPE_TABLE,
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('requirements', sa.JSON(), nullable=True),
        sa.Column('estimated_time', sa.String(length=50), nullable=True),
        sa.Column('skills_validated', sa.JSON(), nullable=True),
        sa.Column('access_tier', sa.String(length=20), nullable=True),
        sa.Column('is_premium', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    op.add_column(CERT_TABLE, sa.Column('catalog_id', sa.String(length=64), nullable=True))
    op.create_foreign_key(
        'fk_certification_catalog',
        CERT_TABLE,
        CERT_TYPE_TABLE,
        ['catalog_id'],
        ['id'],
        ondelete='SET NULL'
    )

    connection = op.get_bind()
    legacy_mapping = {
        'AI Fundamentals Certificate': 'ai-fundamentals',
        'LitmusAI Professional': 'litmusai-professional',
        'AI Ethics Specialist': 'ai-ethics-specialist',
    }

    for title, identifier in legacy_mapping.items():
        connection.execute(
            sa.text(
                'UPDATE {table} SET catalog_id = :identifier WHERE certification_type = :title'.format(table=CERT_TABLE)
            ),
            {'identifier': identifier, 'title': title}
        )


def downgrade():
    op.drop_constraint('fk_certification_catalog', CERT_TABLE, type_='foreignkey')
    op.drop_column(CERT_TABLE, 'catalog_id')
    op.drop_table(CERT_TYPE_TABLE)

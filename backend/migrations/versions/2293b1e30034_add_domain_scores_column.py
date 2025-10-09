"""Add domain_scores JSON column to assessment_result"""

revision = '2293b1e30034'
down_revision = None
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy import column, table


def upgrade():
    op.add_column('assessment_result', sa.Column('domain_scores', sa.JSON(), nullable=True))

    assessment_result_table = table(
        'assessment_result',
        column('id', sa.String(length=36)),
        column('functional_score', sa.Integer()),
        column('ethical_score', sa.Integer()),
        column('rhetorical_score', sa.Integer()),
        column('pedagogical_score', sa.Integer()),
        column('domain_scores', sa.JSON()),
    )

    connection = op.get_bind()
    rows = connection.execute(
        sa.select(
            assessment_result_table.c.id,
            assessment_result_table.c.functional_score,
            assessment_result_table.c.ethical_score,
            assessment_result_table.c.rhetorical_score,
            assessment_result_table.c.pedagogical_score,
        )
    ).fetchall()

    for row in rows:
        payload = {
            'AI Fundamentals': {'score': row.functional_score or 0, 'total': None},
            'Practical Usage': {'score': row.ethical_score or 0, 'total': None},
            'Ethics & Critical Thinking': {'score': row.rhetorical_score or 0, 'total': None},
            'AI Impact & Applications': {'score': row.pedagogical_score or 0, 'total': None},
            'Strategic Understanding': {'score': 0, 'total': None},
        }
        connection.execute(
            assessment_result_table.update()
            .where(assessment_result_table.c.id == row.id)
            .values(domain_scores=payload)
        )


def downgrade():
    op.drop_column('assessment_result', 'domain_scores')

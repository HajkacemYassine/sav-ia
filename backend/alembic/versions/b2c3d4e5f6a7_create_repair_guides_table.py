"""create_repair_guides_table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-13 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'repair_guides',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('guide_number', sa.String(20), unique=True, nullable=False),
        sa.Column('client_id', UUID(as_uuid=True), sa.ForeignKey('clients.id'), nullable=False),
        sa.Column('product_id', UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('summary', sa.Text, nullable=False),
        sa.Column('repair_steps', JSONB, nullable=False, server_default='[]'),
        sa.Column('safety_warnings', JSONB, nullable=True, server_default='[]'),
        sa.Column('conversation_history', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('repair_guides')

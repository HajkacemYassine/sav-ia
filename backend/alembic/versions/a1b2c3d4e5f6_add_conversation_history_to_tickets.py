"""add_conversation_history_to_tickets

Revision ID: a1b2c3d4e5f6
Revises: ce5e9ceb7a74
Create Date: 2026-07-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '839427545057'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('sav_tickets', sa.Column('conversation_history', JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column('sav_tickets', 'conversation_history')

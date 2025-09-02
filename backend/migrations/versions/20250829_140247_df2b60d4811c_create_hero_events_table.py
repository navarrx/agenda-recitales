"""create_hero_events_table

Revision ID: df2b60d4811c
Revises: b7c91b70265f
Create Date: 2025-08-29 14:02:47.402658

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df2b60d4811c'
down_revision: Union[str, None] = 'b7c91b70265f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

"""add_image_url_to_event_requests

Revision ID: d36e91eb380f
Revises: 9f127cc95c19
Create Date: 2025-07-09 12:26:24.659356

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd36e91eb380f'
down_revision: Union[str, None] = '9f127cc95c19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('event_requests', sa.Column('image_url', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('event_requests', 'image_url')

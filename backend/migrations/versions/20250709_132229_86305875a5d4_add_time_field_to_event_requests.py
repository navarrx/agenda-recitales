"""add_time_field_to_event_requests

Revision ID: 86305875a5d4
Revises: d36e91eb380f
Create Date: 2025-07-09 13:22:29.012623

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '86305875a5d4'
down_revision: Union[str, None] = 'd36e91eb380f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('event_requests', sa.Column('time', sa.Time(), nullable=True))
    op.alter_column('event_requests', 'name',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('event_requests', 'email',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('event_requests', 'event_name',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('event_requests', 'artist',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('event_requests', 'date',
               existing_type=postgresql.TIMESTAMP(),
               nullable=True)
    op.alter_column('event_requests', 'venue',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('event_requests', 'city',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('event_requests', 'ticket_url',
               existing_type=sa.VARCHAR(),
               nullable=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('event_requests', 'ticket_url',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('event_requests', 'city',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('event_requests', 'venue',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('event_requests', 'date',
               existing_type=postgresql.TIMESTAMP(),
               nullable=False)
    op.alter_column('event_requests', 'artist',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('event_requests', 'event_name',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('event_requests', 'email',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('event_requests', 'name',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.drop_column('event_requests', 'time')
    # ### end Alembic commands ###

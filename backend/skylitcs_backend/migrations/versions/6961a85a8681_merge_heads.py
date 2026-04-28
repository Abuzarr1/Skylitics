"""merge_heads

Revision ID: 6961a85a8681
Revises: bd5d0b2f9042, e3a7c9f1b245
Create Date: 2026-04-21 14:53:57.719031

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6961a85a8681'
down_revision: Union[str, Sequence[str], None] = ('bd5d0b2f9042', 'e3a7c9f1b245')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

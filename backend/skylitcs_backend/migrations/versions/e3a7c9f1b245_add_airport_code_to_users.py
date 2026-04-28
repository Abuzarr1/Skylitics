"""add_airport_code_to_users

Revision ID: e3a7c9f1b245
Revises: 0f63f5670662
Create Date: 2026-04-21 00:00:00.000000

Adds airport_code column to users table for manager airport isolation.
NULL = admin (sees all airports). Non-null = manager scoped to that IATA code.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e3a7c9f1b245'
down_revision: Union[str, Sequence[str], None] = '0f63f5670662'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('airport_code', sa.String(5), nullable=True))
    op.create_index('ix_users_airport_code', 'users', ['airport_code'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_users_airport_code', table_name='users')
    op.drop_column('users', 'airport_code')

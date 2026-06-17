"""
Declarative base for all SQLAlchemy ORM models.
Import this module in every model file so Alembic can discover metadata.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base class."""
    pass

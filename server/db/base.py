"""
SQLAlchemy 2.0 Declarative Base with UUID Primary Keys & Timestamp Mixins
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import DateTime, text

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    """Provides standard created_at and updated_at timestamptz columns"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=text("now()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=text("now()"),
        onupdate=utc_now,
        nullable=False,
    )

class UUIDPrimaryKeyMixin:
    """Provides standard UUID gen_random_uuid() primary key"""
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )

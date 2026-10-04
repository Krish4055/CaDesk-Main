"""
CAdesk Async SQLAlchemy Session & Transaction Management
Enforces Row-Level Security (RLS) by setting 'app.current_firm_id' per transaction.
"""

from typing import AsyncGenerator, Optional
import uuid
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine
)
from sqlalchemy import text
from server.db.config import db_settings

# Connect arguments: ensure SSL and disable statement cache if on connection pooler
connect_args = {}
if "neon.tech" in db_settings.DATABASE_URL or "sslmode=require" in db_settings.DATABASE_URL:
    connect_args["ssl"] = "require"

if db_settings.PREPARED_STATEMENT_CACHE_SIZE == 0:
    connect_args["prepared_statement_cache_size"] = 0

engine: AsyncEngine = create_async_engine(
    db_settings.DATABASE_URL,
    pool_size=db_settings.DB_POOL_SIZE,
    max_overflow=db_settings.DB_MAX_OVERFLOW,
    pool_timeout=db_settings.DB_POOL_TIMEOUT,
    echo=db_settings.DB_ECHO,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for obtaining an async DB session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

@asynccontextmanager
async def get_tenant_session(firm_id: Optional[uuid.UUID] = None) -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager that binds the PostgreSQL transaction to the tenant firm_id
    for Row Level Security (RLS) enforcement.
    """
    async with AsyncSessionLocal() as session:
        try:
            if firm_id:
                # Set app.current_firm_id for RLS policies
                await session.execute(
                    text("SET LOCAL app.current_firm_id = :firm_id"),
                    {"firm_id": str(firm_id)}
                )
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

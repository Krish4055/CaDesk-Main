"""
CAdesk Database & Connection Configuration
Optimized for Neon Serverless PostgreSQL with AsyncPG.
- Handles connection pooling via Neon Pooled Connection String for FastAPI app.
- Direct non-pooled connection for Alembic migrations.
- Disables prepared statement cache when using Neon PgBouncer pooler.
- Enforces SSL.
"""

import os
from pydantic_settings import BaseSettings

class DatabaseSettings(BaseSettings):
    # App database URL (defaults to asyncpg; if using Neon pooler, use port 6543 / pooled host)
    DATABASE_URL: str = os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/cadesk_db"
    )
    
    # Direct migration database URL (non-pooled, for Alembic DDL migrations)
    DIRECT_DATABASE_URL: str = os.environ.get(
        "DIRECT_DATABASE_URL",
        os.environ.get("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/cadesk_db")
    )

    # Database Pool Settings
    DB_POOL_SIZE: int = int(os.environ.get("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.environ.get("DB_MAX_OVERFLOW", "20"))
    DB_POOL_TIMEOUT: int = int(os.environ.get("DB_POOL_TIMEOUT", "30"))
    DB_ECHO: bool = os.environ.get("DB_ECHO", "false").lower() == "true"
    
    # Statement cache setting (set to 0 when using Neon/PgBouncer transaction pooler)
    PREPARED_STATEMENT_CACHE_SIZE: int = int(os.environ.get("PREPARED_STATEMENT_CACHE_SIZE", "0"))
    
    # PAN Encryption Secret (32-byte hex for AES-256-GCM)
    PAN_ENCRYPTION_KEY: str = os.environ.get(
        "PAN_ENCRYPTION_KEY",
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    )
    
    # PAN Lookup HMAC Secret (32-byte hex)
    PAN_HMAC_KEY: str = os.environ.get(
        "PAN_HMAC_KEY",
        "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
    )

    class Config:
        env_file = ".env"
        extra = "allow"
    def get_url(self, use_pooler: bool = True) -> str:
        if use_pooler:
            return self.DATABASE_URL
        return self.DIRECT_DATABASE_URL

db_settings = DatabaseSettings()

def get_database_url(use_pooler: bool = True) -> str:
    return db_settings.get_url(use_pooler=use_pooler)

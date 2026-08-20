import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

logger = logging.getLogger("smartflow.db")

connect_args = {}
db_url = settings.database_url
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Normalize postgres:// URLs (e.g. from Heroku/Supabase/Render) to postgresql://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

try:
    engine = create_engine(db_url, connect_args=connect_args, future=True)
except Exception as e:
    logger.warning(f"Failed to connect using {db_url}, falling back to local SQLite: {e}")
    engine = create_engine("sqlite:///./smartflow.db", connect_args={"check_same_thread": False}, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


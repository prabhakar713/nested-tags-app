from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Support DATABASE_URL env var (e.g. Render Postgres) with a fallback to local sqlite
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
	# When running with a managed DB (Postgres on Render), use the provided URL
	engine = create_engine(DATABASE_URL)
else:
	# Local development default: SQLite file in backend directory
	SQLALCHEMY_DATABASE_URL = "sqlite:///./trees.db"
	engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
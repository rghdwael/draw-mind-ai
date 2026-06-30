from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Load the Neon URL from the .env file
load_dotenv()
SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_rRjFxd9mp7tP@ep-bitter-smoke-aq2n9n74.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Connect to Neonv# Connect to Neon securely and keep it awake
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True, 
    connect_args={"sslmode": "require"}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
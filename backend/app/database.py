"""
MongoDB database setup using Motor and Beanie.
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
from beanie import init_beanie
from .models import QuotationRequest, FollowUp, ChatSession, User, ActivityLog


class Settings(BaseSettings):
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "wavenxd_sales")

settings = Settings()
client = AsyncIOMotorClient(settings.MONGODB_URI)

db = client[settings.DB_NAME]

async def init_db():
    """Initialize Beanie with the database and document models."""
    await init_beanie(database=db, document_models=[QuotationRequest, FollowUp, ChatSession, User, ActivityLog])

# No longer need get_db dependency; instead use async Motor directly in routers.

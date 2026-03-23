import logging
from typing import Any

from fastapi import HTTPException, status
from pymongo import MongoClient
from pymongo.errors import PyMongoError

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: MongoClient | None = None
_db: Any | None = None


def _connect():
    if not settings.MONGO_URI:
        logger.error("MONGO_URI is not configured.")
        return None, None

    try:
        client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=10000)
        client.admin.command("ping")
        logger.info("MongoDB connection established successfully.")
        return client, client[settings.DB_NAME]
    except PyMongoError as exc:
        logger.error("MongoDB connection failed: %s", exc)
        return None, None


def _get_or_connect_db():
    global _client, _db
    if _db is not None:
        return _db

    _client, _db = _connect()
    return _db


class CollectionProxy:
    def __init__(self, name: str):
        self.name = name

    def _collection(self):
        database = _get_or_connect_db()
        if database is None:
            raise RuntimeError("MongoDB is unavailable. Check MONGO_URI and Atlas network access.")
        return database[self.name]

    def __getattr__(self, item: str):
        return getattr(self._collection(), item)


# Prime connection on import for startup logs.
_get_or_connect_db()

# Existing collections
user_skills_collection = CollectionProxy("user_skills")
users_collection = CollectionProxy("users")

# New collections for user-centric modules
user_context_collection = CollectionProxy("user_context")
goals_collection = CollectionProxy("goals")
tasks_collection = CollectionProxy("tasks")
posts_collection = CollectionProxy("posts")
comments_collection = CollectionProxy("comments")
votes_collection = CollectionProxy("votes")
private_messages_collection = CollectionProxy("private_messages")
resources_collection = CollectionProxy("resources")
feedback_collection = CollectionProxy("feedback")
market_skill_trends_collection = CollectionProxy("market_skill_trends")

# Collaborate module collections
collaboration_projects_collection = CollectionProxy("collaboration_projects")
collaboration_requests_collection = CollectionProxy("collaboration_requests")
opportunities_collection = CollectionProxy("opportunities")


def is_database_connected() -> bool:
    return _get_or_connect_db() is not None


def get_db():
    """Dependency to get database instance."""
    database = _get_or_connect_db()
    if database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Verify MONGO_URI and Atlas connectivity.",
        )
    return database

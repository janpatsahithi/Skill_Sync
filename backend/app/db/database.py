from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017"

client = MongoClient(MONGO_URI)
db = client["skillsync"]

# Existing collections
user_skills_collection = db["user_skills"]
users_collection = db["users"]

# New collections for user-centric modules
user_context_collection = db["user_context"]  # User background, interests, goals, preferences
goals_collection = db["goals"]  # User goals (short-term/long-term)
tasks_collection = db["tasks"]  # Tasks linked to goals
posts_collection = db["posts"]  # Community posts
comments_collection = db["comments"]  # Comments on posts
resources_collection = db["resources"]  # Learning resources
feedback_collection = db["feedback"]  # User feedback on recommendations
market_skill_trends_collection = db["market_skill_trends"]  # Cached live market skill trends

# Collaborate module collections
collaboration_projects_collection = db["collaboration_projects"]
collaboration_requests_collection = db["collaboration_requests"]
opportunities_collection = db["opportunities"]


def get_db():
    """
    Dependency to get database instance
    """
    return db

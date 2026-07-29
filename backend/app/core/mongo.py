import os
from pymongo import MongoClient
import logging

logger = logging.getLogger("wildlife")

MONGODB_URI = os.getenv("MONGODB_URI", os.getenv("MONGO_URL", "mongodb://wildlife:wildlife_pass@localhost:27017"))
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "wildlife_metadata")

client = None
db = None
observations_collection = None

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGO_DB_NAME]
    observations_collection = db["observations"]
    # Verify connection
    client.admin.command('ping')
    logger.info(f"MongoDB connected successfully to database '{MONGO_DB_NAME}'.")
except Exception as e:
    logger.exception("Could not connect to MongoDB. Is the container running?")

def get_mongo_db():
    return db

def get_observations_collection():
    return observations_collection

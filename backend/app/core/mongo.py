import os
from pymongo import MongoClient
import logging

logger = logging.getLogger("wildlife")

MONGODB_URI = os.getenv("MONGODB_URI", os.getenv("MONGO_URL", "mongodb://wildlife:wildlife_pass@localhost:27017"))

client = None
db = None
observations_collection = None

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client["wildlife"]
    observations_collection = db["observations"]
    # Verify connection
    client.admin.command('ping')
    logger.info("MongoDB connected successfully.")
except Exception as e:
    logger.exception("Could not connect to MongoDB. Is the container running?")

def get_mongo_db():
    return db

def get_observations_collection():
    return observations_collection

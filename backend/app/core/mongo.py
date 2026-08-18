import os
from pymongo import MongoClient
import logging

logger = logging.getLogger("wildlife")

MONGODB_URI = os.getenv("MONGODB_URI", os.getenv("MONGO_URL", "mongodb://wildlife:wildlife_pass@mongo:27017/?authSource=admin"))
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "wildlife_metadata")

client = None
db = None
observations_collection = None


def connect_mongo():
    global client, db, observations_collection
    if client is not None:
        try:
            client.admin.command('ping')
            return db
        except Exception:
            client = None
            db = None
            observations_collection = None

    uri = MONGODB_URI
    if "authSource=" not in uri and "@" in uri:
        separator = "&" if "?" in uri else "?"
        uri = f"{uri}{separator}authSource=admin"

    try:
        c = MongoClient(uri, serverSelectionTimeoutMS=2000)
        c.admin.command('ping')
        client = c
        db = client[MONGO_DB_NAME]
        observations_collection = db["observations"]
        logger.info(f"MongoDB connected successfully to database '{MONGO_DB_NAME}'.")
        return db
    except Exception as e:
        client = None
        db = None
        observations_collection = None
        logger.warning(f"MongoDB not available ({e}). Operating in PostgreSQL-only mode.")
        return None


# Initial attempt
connect_mongo()


def get_mongo_db():
    if db is None:
        connect_mongo()
    return db


def get_observations_collection():
    if observations_collection is None:
        connect_mongo()
    return observations_collection


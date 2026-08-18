import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.mongo import get_observations_collection

router = APIRouter(prefix="/api/system", tags=["system"])

START_TIME = datetime.utcnow()

# Configure structured JSON logger
json_logger = logging.getLogger("wildlife.json")


def log_structured_event(event_type: str, details: dict):
    """Emit a structured JSON log entry to stdout."""
    payload = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "details": details,
    }
    json_logger.info(json.dumps(payload))


@router.get("/health")
def get_system_health(db: Session = Depends(get_db)):
    """
    System health check returning database status, mongo status, and uptime_seconds.
    """
    # 1. Check Postgres connection
    db_status = "disconnected"
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"

    # 2. Check Mongo connection
    mongo_status = "disconnected"
    mongo_coll = get_observations_collection()
    if mongo_coll is not None:
        mongo_status = "connected"

    uptime_seconds = int((datetime.utcnow() - START_TIME).total_seconds())

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "database": db_status,
        "mongo": mongo_status,
        "uptime_seconds": uptime_seconds,
    }

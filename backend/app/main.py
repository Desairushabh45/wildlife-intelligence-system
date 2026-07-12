import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import auth, sites, species, surveys, observations
from app.core.database import Base, engine

# IMPORTANT: Import models so SQLAlchemy registers them
import app.models

logger = logging.getLogger("wildlife")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle for the FastAPI application."""

    try:
        print(Base.metadata.tables.keys())
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.exception(f"Database initialization failed: {e}")

    yield


app = FastAPI(
    title="Wildlife Population Intelligence System",
    description="AI-powered platform for wildlife monitoring, species identification, and biodiversity analytics",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sites.router)
app.include_router(surveys.router)
app.include_router(species.router)
app.include_router(observations.router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "wildlife-population-intelligence-system",
    }
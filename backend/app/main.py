import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, sites, species, surveys
from app.core.database import Base, engine

logger = logging.getLogger("wildlife")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle for the FastAPI application."""
    # --- Startup -------------------------------------------------------
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created / verified successfully.")
    except Exception:
        logger.exception(
            "Could not connect to the database. "
            "Tables were NOT created. The app will start but DB operations will fail."
        )
    yield
    # --- Shutdown (nothing to clean up currently) ----------------------


app = FastAPI(
    title="Wildlife Population Intelligence System",
    description="AI-powered platform for wildlife monitoring, species ID, and biodiversity analytics",
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


@app.get("/")
def root():
    return {"status": "ok", "service": "wildlife-population-intelligence-system"}

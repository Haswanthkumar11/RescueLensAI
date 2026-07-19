import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.db import get_settings
from app.routers import upload, analyze, history, incident, profile
from app.services.startup_checks import validate_schema

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Fail fast and loud if the database schema doesn't match what this
    # backend expects, instead of letting it surface later as a
    # confusing runtime error on whichever endpoint a user happens to
    # hit first (this is exactly how the contributing_factors /
    # user_profiles issues showed up during development).
    validate_schema()
    yield


app = FastAPI(
    title="RescueLens AI",
    description="AI-powered emergency image triage for faster disaster response.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(analyze.router)
app.include_router(history.router)
app.include_router(incident.router)
app.include_router(profile.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "RescueLens AI backend"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

"""
EcoPulse FastAPI Application Entry Point.

Registers all routers and configures CORS so the React Native
frontend (running on a phone/emulator) can reach the API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import activities, challenges, users
from app.services.database import init_db

app = FastAPI(
    title="EcoPulse API",
    description="🌱 Nudge Engine — Carbon footprint tracker with AI-powered Eco-Challenges",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS - allow specific origins for better security
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost", 
        "http://localhost:8081", 
        "http://localhost:3000", 
        "https://ecopulse-navy.vercel.app", 
        "https://ecopulse.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup: initialise SQLite tables
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event() -> None:
    init_db()


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(activities.router, prefix="/api/activities", tags=["Activities"])
app.include_router(challenges.router, prefix="/api/challenges", tags=["Challenges"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])


@app.get("/", tags=["Health"])
async def root() -> dict:
    return {"status": "ok", "message": "EcoPulse API is running 🌱"}


@app.get("/health", tags=["Health"])
async def health() -> dict:
    return {"status": "healthy"}

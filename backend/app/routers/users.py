"""
Users Router

GET /api/users/{user_id}/profile  — Full profile: coins, level, streak, progress
"""

from fastapi import APIRouter

from app.models.schemas import UserProfile
from app.services.gamification import get_level, level_progress
from app.services import database as db

router = APIRouter()


@router.get("/{user_id}/profile", summary="Get user profile")
async def get_profile(user_id: str) -> dict:
    """
    Return the user's full gamification profile.
    Creates the user record automatically if this is their first visit.
    """
    row = db.get_or_create_user(user_id)
    coins = row["eco_coins"]
    level = get_level(coins)
    progress = level_progress(coins)

    return {
        "user_id": row["user_id"],
        "display_name": row["display_name"],
        "eco_coins": coins,
        "level": level.value,
        "streak_days": row["streak_days"],
        "logs_count": row["logs_count"],
        "total_footprint_kg": round(row["total_footprint_kg"], 2),
        "level_progress": progress,
    }


@router.get("/{user_id}/history", summary="Get footprint history")
async def get_history(user_id: str) -> list[dict]:
    """Return the last 7 activity logs for chart rendering."""
    return db.get_recent_logs(user_id, days=7)

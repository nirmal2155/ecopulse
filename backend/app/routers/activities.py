"""
Activities Router — POST /api/activities/log

The main endpoint of EcoPulse.  One call does everything:
  1. Calculate carbon footprint
  2. Generate AI (or mock) Eco-Challenges
  3. Award Eco-Coins
  4. Persist everything to SQLite
  5. Return a single rich response to the frontend
"""

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    ActivityLogRequest,
    ActivityLogResponse,
    UserProfile,
)
from app.services.carbon_calculator import calculate_footprint, get_all_factors
from app.services.nudge_engine import generate_challenges
from app.services.gamification import (
    calculate_log_reward,
    get_level,
    level_progress,
)
from app.services import database as db

router = APIRouter()


@router.post("/log", response_model=ActivityLogResponse, summary="Log daily activities")
async def log_activities(payload: ActivityLogRequest) -> ActivityLogResponse:
    """
    Submit a list of daily activities and receive:
    - Carbon footprint (kg CO₂e) with breakdown
    - 3 AI-generated personalised Eco-Challenges
    - Eco-Coins earned this session
    - Updated user level and streak
    """
    if not payload.activities:
        raise HTTPException(status_code=400, detail="At least one activity is required")

    # 1. Get or create user
    user_row = db.get_or_create_user(payload.user_id)

    user = UserProfile(
        user_id=user_row["user_id"],
        eco_coins=user_row["eco_coins"],
        level=get_level(user_row["eco_coins"]),
        streak_days=user_row["streak_days"],
        total_footprint_kg=user_row["total_footprint_kg"],
        logs_count=user_row["logs_count"],
    )

    # 2. Calculate footprint
    footprint = calculate_footprint(payload.activities)

    # 3. Determine previous footprint for reduction bonus
    recent = db.get_recent_logs(payload.user_id, days=2)
    previous_kg = recent[0]["footprint_kg"] if len(recent) >= 1 else None

    # 4. Update streak
    streak = db.update_streak_and_logs(payload.user_id, footprint.total_kg)

    # 5. Calculate coins
    coins_earned, _ = calculate_log_reward(streak, footprint.total_kg, previous_kg)

    # 6. Generate AI challenges
    challenges, ai_powered = await generate_challenges(footprint, user)

    # 7. Persist
    db.save_activity_log(
        payload.user_id,
        footprint.total_kg,
        {"transport": footprint.breakdown.transport_kg, "food": footprint.breakdown.food_kg},
        footprint.hot_spot,
    )
    db.save_challenges(payload.user_id, [ch.model_dump() for ch in challenges])
    new_balance = db.update_user_coins(payload.user_id, coins_earned)

    return ActivityLogResponse(
        footprint=footprint,
        challenges=challenges,
        coins_earned=coins_earned,
        new_balance=new_balance,
        streak_days=streak,
        level=get_level(new_balance),
        ai_powered=ai_powered,
    )


@router.get("/factors", summary="Get all emission factors")
async def get_factors() -> dict:
    """Return the full emission factor table — useful for the frontend to show hints."""
    return get_all_factors()


@router.get("/history/{user_id}", summary="Get recent activity logs")
async def get_history(user_id: str, days: int = 7) -> list[dict]:
    """Return the last N days of activity logs for chart rendering."""
    return db.get_recent_logs(user_id, days)

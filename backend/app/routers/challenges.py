"""
Challenges Router

GET  /api/challenges/{user_id}       — Fetch active + completed challenges
POST /api/challenges/{id}/complete   — Mark a challenge done, award coins
"""

from fastapi import APIRouter, HTTPException

from app.models.schemas import Challenge, ChallengeDifficulty
from app.services.gamification import calculate_challenge_reward, get_level
from app.services import database as db

router = APIRouter()


@router.get("/{user_id}", response_model=list[Challenge], summary="Get user challenges")
async def get_challenges(user_id: str) -> list[Challenge]:
    """Return all active and completed challenges for a user."""
    rows = db.get_user_challenges(user_id)
    return [
        Challenge(
            id=row["id"],
            title=row["title"],
            description=row["description"],
            difficulty=ChallengeDifficulty(row["difficulty"]),
            coins_reward=row["coins_reward"],
            category=row["category"],
            completed=bool(row["completed"]),
        )
        for row in rows
    ]


@router.post("/{challenge_id}/complete", summary="Complete a challenge")
async def complete_challenge(
    challenge_id: str,
    user_id: str = "demo_user",
) -> dict:
    """
    Mark a challenge as completed and award Eco-Coins.
    Returns the updated coin balance and level.
    """
    row = db.complete_challenge(challenge_id, user_id)
    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found or already completed",
        )

    difficulty = ChallengeDifficulty(row["difficulty"])
    coins = calculate_challenge_reward(difficulty)
    new_balance = db.update_user_coins(user_id, coins)

    return {
        "message": f"✅ Challenge completed! +{coins} Eco-Coins",
        "coins_earned": coins,
        "new_balance": new_balance,
        "new_level": get_level(new_balance).value,
    }

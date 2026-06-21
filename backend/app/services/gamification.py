"""
Gamification Engine — Eco-Coins & Level System

Implements BJ Fogg's Tiny Habits model:
  reward the SMALLEST green action to build momentum and habit loops.

Coin Economy:
  +5   Log daily activities (just showing up!)
  +10  Reduce footprint vs. yesterday
  +20  Complete an Eco-Challenge (medium)
  +15  Complete an Eco-Challenge (easy)
  +40  Complete an Eco-Challenge (hard)
  +50  7-day streak bonus

Level Thresholds:
  0–100    → Seedling 🌱
  101–300  → Sprout 🌿
  301–700  → Tree 🌳
  701+     → Forest Guardian 🌲
"""

from app.models.schemas import UserLevel, ChallengeDifficulty


# ---------------------------------------------------------------------------
# Coin reward constants
# ---------------------------------------------------------------------------

COINS_LOG_ACTIVITY = 5
COINS_FOOTPRINT_REDUCTION = 10
COINS_STREAK_7_DAYS = 50

COINS_BY_DIFFICULTY = {
    ChallengeDifficulty.easy:   15,
    ChallengeDifficulty.medium: 20,
    ChallengeDifficulty.hard:   40,
}

# ---------------------------------------------------------------------------
# Level thresholds
# ---------------------------------------------------------------------------

LEVELS = [
    (701, UserLevel.forest_guardian),
    (301, UserLevel.tree),
    (101, UserLevel.sprout),
    (0,   UserLevel.seedling),
]


def get_level(eco_coins: int) -> UserLevel:
    """Return the user's level badge based on total Eco-Coins."""
    for threshold, level in LEVELS:
        if eco_coins >= threshold:
            return level
    return UserLevel.seedling


def calculate_log_reward(
    streak_days: int,
    new_footprint_kg: float,
    previous_footprint_kg: float | None,
) -> tuple[int, list[str]]:
    """
    Calculate coins earned for a single log submission.

    Returns:
        (total_coins, list_of_reasons) — reasons shown as toasts in the UI.
    """
    coins = 0
    reasons: list[str] = []

    # Base reward for logging
    coins += COINS_LOG_ACTIVITY
    reasons.append(f"+{COINS_LOG_ACTIVITY} for logging today's activities")

    # Footprint reduction bonus
    if previous_footprint_kg is not None and new_footprint_kg < previous_footprint_kg:
        saved = round(previous_footprint_kg - new_footprint_kg, 2)
        coins += COINS_FOOTPRINT_REDUCTION
        reasons.append(f"+{COINS_FOOTPRINT_REDUCTION} for reducing footprint by {saved} kg CO₂e")

    # 7-day streak bonus
    if streak_days > 0 and streak_days % 7 == 0:
        coins += COINS_STREAK_7_DAYS
        reasons.append(f"+{COINS_STREAK_7_DAYS} bonus for {streak_days}-day streak! 🔥")

    return coins, reasons


def calculate_challenge_reward(difficulty: ChallengeDifficulty) -> int:
    """Return coins for completing a challenge of a given difficulty."""
    return COINS_BY_DIFFICULTY.get(difficulty, 15)


def level_progress(eco_coins: int) -> dict:
    """
    Return progress toward the next level.

    Example: {"current": "Sprout", "next": "Tree", "progress_pct": 64}
    """
    thresholds = [
        (0,   101, UserLevel.seedling,        UserLevel.sprout),
        (101, 301, UserLevel.sprout,          UserLevel.tree),
        (301, 701, UserLevel.tree,            UserLevel.forest_guardian),
        (701, None, UserLevel.forest_guardian, None),
    ]

    for low, high, current, next_level in thresholds:
        if high is None or eco_coins < high:
            if high is None:
                return {
                    "current": current.value,
                    "next": None,
                    "progress_pct": 100,
                    "coins_to_next": 0,
                }
            span = high - low
            progress = eco_coins - low
            pct = round((progress / span) * 100)
            return {
                "current": current.value,
                "next": next_level.value if next_level else None,
                "progress_pct": min(pct, 99),  # never show 100% until levelled up
                "coins_to_next": high - eco_coins,
            }

    return {"current": UserLevel.forest_guardian.value, "next": None, "progress_pct": 100, "coins_to_next": 0}

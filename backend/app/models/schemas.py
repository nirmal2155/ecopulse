"""
Pydantic schemas — the single source of truth for request/response shapes.

Every data structure that crosses the API boundary lives here so that
models, routers, and services all share the same type definitions.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class TransportType(str, Enum):
    car = "car"
    bus = "bus"
    flight = "flight"
    walk = "walk"
    cycle = "cycle"
    train = "train"


class FoodType(str, Enum):
    beef = "beef"
    pork = "pork"
    chicken = "chicken"
    vegetarian = "vegetarian"
    vegan = "vegan"


class ActivityCategory(str, Enum):
    transport = "transport"
    food = "food"


class ChallengeDifficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


# ---------------------------------------------------------------------------
# Activity Log
# ---------------------------------------------------------------------------

class ActivityItem(BaseModel):
    """A single logged activity (e.g., 25 km by car, or 1 beef meal)."""
    category: ActivityCategory
    type: str = Field(..., description="e.g. 'car', 'beef', 'bus'")
    quantity: float = Field(..., gt=0, description="km for transport, meals for food")


class ActivityLogRequest(BaseModel):
    """POST /api/activities/log request body."""
    user_id: str = Field(default="demo_user")
    activities: list[ActivityItem]


# ---------------------------------------------------------------------------
# Carbon Result
# ---------------------------------------------------------------------------

class CategoryBreakdown(BaseModel):
    transport_kg: float = 0.0
    food_kg: float = 0.0


class CarbonResult(BaseModel):
    """Calculated carbon footprint for the submitted activities."""
    total_kg: float
    breakdown: CategoryBreakdown
    hot_spot: str = Field(..., description="Highest-impact activity label")
    vs_global_avg: float = Field(..., description="% above/below 13.7 kg/day global avg")


# ---------------------------------------------------------------------------
# Eco-Challenge
# ---------------------------------------------------------------------------

class Challenge(BaseModel):
    id: str
    title: str
    description: str
    difficulty: ChallengeDifficulty
    coins_reward: int
    category: str
    completed: bool = False


# ---------------------------------------------------------------------------
# Eco-Coins & Gamification
# ---------------------------------------------------------------------------

class UserLevel(str, Enum):
    seedling = "Seedling"
    sprout = "Sprout"
    tree = "Tree"
    forest_guardian = "Forest Guardian"


class UserProfile(BaseModel):
    user_id: str
    display_name: str = "EcoPulse User"
    eco_coins: int = 0
    level: UserLevel = UserLevel.seedling
    streak_days: int = 0
    total_footprint_kg: float = 0.0
    logs_count: int = 0


class CoinTransaction(BaseModel):
    reason: str
    amount: int


# ---------------------------------------------------------------------------
# Composite API Response
# ---------------------------------------------------------------------------

class ActivityLogResponse(BaseModel):
    """Full response after logging activities — everything the frontend needs."""
    footprint: CarbonResult
    challenges: list[Challenge]
    coins_earned: int
    new_balance: int
    streak_days: int
    level: UserLevel
    ai_powered: bool = Field(..., description="True if challenges were AI-generated")

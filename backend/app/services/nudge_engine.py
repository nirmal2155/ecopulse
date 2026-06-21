"""
AI Nudge Engine — Personalised Eco-Challenge Generator

Strategy:
  1. If OPENAI_API_KEY is set → call GPT-4o-mini with JSON mode.
  2. If key is missing/empty → fall back to the mock engine, which uses
     a curated challenge bank filtered by the user's hot-spot activity.

This design means the app always works — even during a live demo where
the Wi-Fi is down or the API key hasn't been added yet.

Prompt Engineering Notes:
  - System prompt positions the AI as a "friendly climate coach", never
    preachy or guilt-tripping. Positive framing only.
  - GPT is asked to return structured JSON (JSON mode) so we never need
    to parse free text.
  - Challenge difficulty is calibrated to the user's Eco-Coin level so
    beginners get easy wins and veterans get stretched.
"""

import json
import uuid
import random
import logging

from app.core.config import settings
from app.models.schemas import Challenge, ChallengeDifficulty, CarbonResult, UserProfile

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Mock Challenge Bank (used when OpenAI key is absent)
# ---------------------------------------------------------------------------

MOCK_CHALLENGES: dict[str, list[dict]] = {
    "car": [
        {
            "title": "🚌 Ride the bus tomorrow",
            "description": "Swap just one car journey for the bus. You'll save ~0.1 kg CO₂ per km — that adds up fast!",
            "difficulty": "easy",
            "coins_reward": 15,
            "category": "transport",
        },
        {
            "title": "🚶 Walk one errand today",
            "description": "Choose one errand under 2 km and walk it. Zero emissions, free exercise.",
            "difficulty": "easy",
            "coins_reward": 10,
            "category": "transport",
        },
        {
            "title": "🚗 Carpool this week",
            "description": "Organise a carpool for at least 2 journeys this week — halve your transport footprint instantly.",
            "difficulty": "medium",
            "coins_reward": 25,
            "category": "transport",
        },
        {
            "title": "🚴 Pedal instead of drive",
            "description": "Swap a short car trip for a bicycle ride. Saves 0.2 kg CO₂e per km and stays active!",
            "difficulty": "medium",
            "coins_reward": 20,
            "category": "transport",
        },
        {
            "title": "🚘 ECO-Driving Mode",
            "description": "Drive at moderate speeds and avoid rapid acceleration to save up to 15% fuel.",
            "difficulty": "easy",
            "coins_reward": 10,
            "category": "transport",
        },
    ],
    "flight": [
        {
            "title": "🚂 Choose train over plane next trip",
            "description": "Rail emits ~6× less CO₂ than flying. Check if your next trip is train-able.",
            "difficulty": "hard",
            "coins_reward": 40,
            "category": "transport",
        },
        {
            "title": "📹 Host a video call instead",
            "description": "Replace one upcoming business trip with a video meeting this week.",
            "difficulty": "medium",
            "coins_reward": 20,
            "category": "transport",
        },
        {
            "title": "🌳 Offset your flight emissions",
            "description": "Support verified clean energy projects to balance out unavoidable flight emissions.",
            "difficulty": "hard",
            "coins_reward": 30,
            "category": "transport",
        },
        {
            "title": "🎒 Travel light next flight",
            "description": "Packing 5kg less reduces aircraft fuel burn and lowers your ticket footprint.",
            "difficulty": "easy",
            "coins_reward": 10,
            "category": "transport",
        },
    ],
    "beef": [
        {
            "title": "🥗 Try a veggie lunch today",
            "description": "Swapping one beef meal for vegetarian saves ~2.75 kg CO₂e — equal to a 14 km car journey!",
            "difficulty": "easy",
            "coins_reward": 15,
            "category": "food",
        },
        {
            "title": "🌱 Meat-Free Monday",
            "description": "Commit to zero meat for one full day. Your single biggest dietary win.",
            "difficulty": "medium",
            "coins_reward": 25,
            "category": "food",
        },
        {
            "title": "🥩 Halve your meat portions",
            "description": "Reduce portion size by 50% for this week's meat meals — same flavour, half the footprint.",
            "difficulty": "easy",
            "coins_reward": 12,
            "category": "food",
        },
        {
            "title": "🥛 Try plant-based milk",
            "description": "Swap dairy milk for oat, almond, or soy milk in your coffee. Saves 0.5kg CO₂e.",
            "difficulty": "easy",
            "coins_reward": 12,
            "category": "food",
        },
        {
            "title": "🧀 Cheese-free day",
            "description": "Skip cheese today. Dairy production is a major source of agricultural methane.",
            "difficulty": "easy",
            "coins_reward": 12,
            "category": "food",
        },
    ],
    "pork": [
        {
            "title": "🥗 Swap pork for plant protein",
            "description": "Try cooking with tofu, tempeh, or beans in place of pork. Saves ~1.0 kg CO₂e per serving.",
            "difficulty": "easy",
            "coins_reward": 12,
            "category": "food",
        },
        {
            "title": "🌾 Try grains-and-greens bowl",
            "description": "Enjoy a dinner centered around locally grown grains and seasonal greens.",
            "difficulty": "easy",
            "coins_reward": 10,
            "category": "food",
        },
    ],
    "chicken": [
        {
            "title": "🍲 Try a vegan curry recipe",
            "description": "Cook a fully vegan chickpea or lentil curry tonight instead of chicken.",
            "difficulty": "easy",
            "coins_reward": 12,
            "category": "food",
        },
        {
            "title": "🍄 Hearty mushroom swap",
            "description": "Replace chicken in your stir-fry with portobello or shiitake mushrooms.",
            "difficulty": "easy",
            "coins_reward": 15,
            "category": "food",
        },
    ],
    "bus": [
        {
            "title": "🚴 Cycle for commute today",
            "description": "Swap your bus trip for a bicycle ride today. Active travel emits zero greenhouse gases!",
            "difficulty": "medium",
            "coins_reward": 20,
            "category": "transport",
        },
        {
            "title": "🚶 Walk to the next stop",
            "description": "Walk to the next bus stop to get extra exercise and enjoy the neighborhood.",
            "difficulty": "easy",
            "coins_reward": 10,
            "category": "transport",
        },
    ],
    "train": [
        {
            "title": "🚲 Multi-modal cycling run",
            "description": "Cycle to or from the train station instead of booking a rideshare vehicle.",
            "difficulty": "easy",
            "coins_reward": 15,
            "category": "transport",
        },
        {
            "title": "📖 Unwind with a book",
            "description": "Read a physical book or listen to offline music instead of streaming high-data videos on the train.",
            "difficulty": "easy",
            "coins_reward": 8,
            "category": "general",
        },
    ],
    "general": [
        {
            "title": "📊 Log activities for 3 days straight",
            "description": "Awareness is the first step. Track for 3 days and spot your own patterns.",
            "difficulty": "easy",
            "coins_reward": 10,
            "category": "general",
        },
        {
            "title": "💡 Share your footprint with a friend",
            "description": "Tell one friend about EcoPulse today. Collective action multiplies impact.",
            "difficulty": "easy",
            "coins_reward": 15,
            "category": "general",
        },
        {
            "title": "🚿 5-minute shower challenge",
            "description": "Limit your shower to 5 minutes to conserve hot water heating energy.",
            "difficulty": "easy",
            "coins_reward": 12,
            "category": "general",
        },
        {
            "title": "🔌 Unplug vampire devices",
            "description": "Unplug standby chargers, gaming rigs, and TV boxes before bed to stop vampire draw.",
            "difficulty": "easy",
            "coins_reward": 10,
            "category": "general",
        },
        {
            "title": "👕 Cold wash laundry",
            "description": "Wash clothes using a cold cycle. Saves 90% of the washing machine's heating energy.",
            "difficulty": "easy",
            "coins_reward": 15,
            "category": "general",
        },
        {
            "title": "🌡️ Thermostat adjust",
            "description": "Set your thermostat 1°C lower (or higher in summer) to reduce energy loads.",
            "difficulty": "easy",
            "coins_reward": 10,
            "category": "general",
        },
    ],
}


def _get_mock_challenges(hot_spot: str, user_level: str) -> list[Challenge]:
    """
    Return 3 challenges from the mock bank, prioritising the hot-spot
    activity and padding with general challenges.
    """
    # Map hot_spot string to a bank key
    bank_key = "general"
    for key in MOCK_CHALLENGES:
        if key in hot_spot.lower():
            bank_key = key
            break

    pool = MOCK_CHALLENGES.get(bank_key, []) + MOCK_CHALLENGES["general"]
    # Deduplicate and pick 3
    seen = set()
    selected = []
    for ch in pool:
        if ch["title"] not in seen and len(selected) < 3:
            seen.add(ch["title"])
            selected.append(ch)

    # Pad if needed
    while len(selected) < 3:
        selected.append(random.choice(MOCK_CHALLENGES["general"]))  # noqa: S311

    return [
        Challenge(
            id=str(uuid.uuid4()),
            title=ch["title"],
            description=ch["description"],
            difficulty=ChallengeDifficulty(ch["difficulty"]),
            coins_reward=ch["coins_reward"],
            category=ch["category"],
            completed=False,
        )
        for ch in selected[:3]
    ]


# ---------------------------------------------------------------------------
# OpenAI Integration
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are EcoPulse's friendly climate coach — encouraging, never preachy.
Your job is to generate 3 personalised Eco-Challenges for a user based on their daily 
carbon footprint data.

Rules:
- Challenges must be SPECIFIC and ACHIEVABLE today or this week.
- Use positive framing only ("try X" not "stop doing Y").
- Scale difficulty to the user's level (Seedling = easiest, Forest Guardian = hardest).
- Return ONLY valid JSON — no markdown, no extra text.

JSON format:
{
  "challenges": [
    {
      "title": "Short action title with an emoji",
      "description": "One sentence: what to do and why it helps (include a CO₂ saving fact)",
      "difficulty": "easy|medium|hard",
      "coins_reward": <10-50 integer>,
      "category": "transport|food|energy|general"
    }
  ]
}"""


async def generate_challenges(
    footprint: CarbonResult,
    user: UserProfile,
) -> tuple[list[Challenge], bool]:
    """
    Generate 3 personalised Eco-Challenges.

    Returns:
        (challenges, ai_powered) — ai_powered=True if OpenAI was used.
    """
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.startswith("sk-your"):
        logger.info("No OpenAI key — using mock challenge engine")
        return _get_mock_challenges(footprint.hot_spot, user.level.value), False

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        user_prompt = (
            f"User level: {user.level.value} | Eco-Coins: {user.eco_coins} | Streak: {user.streak_days} days\n"
            f"Today's footprint: {footprint.total_kg} kg CO₂e\n"
            f"Breakdown: transport={footprint.breakdown.transport_kg} kg, food={footprint.breakdown.food_kg} kg\n"
            f"Biggest impact activity (hot spot): {footprint.hot_spot}\n"
            f"vs. global average: {footprint.vs_global_avg:+.1f}%\n\n"
            "Generate 3 personalised Eco-Challenges targeting the hot spot first."
        )

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.8,
            max_tokens=600,
        )

        raw = json.loads(response.choices[0].message.content)
        challenges_data = raw.get("challenges", [])

        challenges = [
            Challenge(
                id=str(uuid.uuid4()),
                title=ch["title"],
                description=ch["description"],
                difficulty=ChallengeDifficulty(ch.get("difficulty", "easy")),
                coins_reward=int(ch.get("coins_reward", 15)),
                category=ch.get("category", "general"),
                completed=False,
            )
            for ch in challenges_data[:3]
        ]

        logger.info("✅ GPT-4o-mini generated %d challenges", len(challenges))
        return challenges, True

    except Exception as exc:  # noqa: BLE001
        logger.warning("OpenAI call failed (%s) — falling back to mock", exc)
        return _get_mock_challenges(footprint.hot_spot, user.level.value), False

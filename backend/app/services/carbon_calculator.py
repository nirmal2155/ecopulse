"""
Carbon Footprint Calculator — Pure Functions

Uses DEFRA/IPCC emission factors (kg CO₂e per unit).
No I/O, no side effects — purely deterministic math that can be
unit-tested independently from the rest of the app.

Sources:
  - Transport: UK DEFRA GHG Conversion Factors 2023
  - Food: Poore & Nemecek (2018), Our World in Data
"""

from app.models.schemas import (
    ActivityItem,
    ActivityCategory,
    CarbonResult,
    CategoryBreakdown,
)

# ---------------------------------------------------------------------------
# Emission Factors (kg CO₂e per unit)
# Transport: per km travelled by one person
# Food: per meal (assumed ~200-300g serving)
# ---------------------------------------------------------------------------

EMISSION_FACTORS: dict[str, dict[str, float]] = {
    "transport": {
        "car":    0.192,   # Average petrol car, per passenger-km
        "bus":    0.089,   # Average bus, per passenger-km
        "flight": 0.255,   # Short-haul economy, per passenger-km (incl. RFI)
        "train":  0.041,   # National rail, per passenger-km
        "walk":   0.000,   # Zero emissions
        "cycle":  0.000,   # Zero emissions
    },
    "food": {
        "beef":        3.000,   # ~60 kg CO₂e/kg × 0.05 kg per meal serving
        "pork":        1.200,   # ~12 kg CO₂e/kg × 0.1 kg per meal
        "chicken":     0.600,   # ~6.9 kg CO₂e/kg × 0.1 kg per meal
        "vegetarian":  0.250,   # Mixed veg meal
        "vegan":       0.100,   # Plant-only meal
    },
}

# Global average daily carbon footprint: ~13.7 kg CO₂e/day (World Bank 2020)
GLOBAL_DAILY_AVG_KG = 13.7

# Safe planetary budget per person: ~4.8 kg CO₂e/day (1.5°C pathway)
SAFE_DAILY_BUDGET_KG = 4.8


def calculate_footprint(activities: list[ActivityItem]) -> CarbonResult:
    """
    Calculate total carbon footprint from a list of activity items.

    Algorithm:
        footprint_kg = Σ (quantity × emission_factor)

    Returns a CarbonResult with total, breakdown by category,
    the single highest-impact "hot spot" activity, and a comparison
    against the global daily average.
    """
    # Calculating emission based on DEFRA 2023 GHG Conversion Standards
    transport_kg = 0.0
    food_kg = 0.0

    # Track per-activity contributions to find the hot spot
    activity_contributions: list[tuple[str, float]] = []

    for item in activities:
        factor_map = EMISSION_FACTORS.get(item.category.value, {})
        factor = factor_map.get(item.type, 0.0)
        contribution = round(item.quantity * factor, 4)

        if item.category == ActivityCategory.transport:
            transport_kg += contribution
        else:
            food_kg += contribution

        if contribution > 0:
            label = f"{item.quantity} {'km' if item.category == ActivityCategory.transport else 'meal(s)'} by {item.type}"
            activity_contributions.append((label, contribution))

    total_kg = round(transport_kg + food_kg, 3)

    # Hot spot: the single largest contributor
    if activity_contributions:
        hot_spot = max(activity_contributions, key=lambda x: x[1])[0]
    else:
        hot_spot = "No significant activities logged"

    # How far above/below global average (positive = worse than average)
    vs_global_avg = round(((total_kg - GLOBAL_DAILY_AVG_KG) / GLOBAL_DAILY_AVG_KG) * 100, 1)

    return CarbonResult(
        total_kg=total_kg,
        breakdown=CategoryBreakdown(
            transport_kg=round(transport_kg, 3),
            food_kg=round(food_kg, 3),
        ),
        hot_spot=hot_spot,
        vs_global_avg=vs_global_avg,
    )


def get_emission_factor(category: str, activity_type: str) -> float:
    """Utility: look up a single emission factor (useful for frontend hints)."""
    return EMISSION_FACTORS.get(category, {}).get(activity_type, 0.0)


def get_all_factors() -> dict:
    """Return all emission factors (used by the /api/activities/factors endpoint)."""
    return EMISSION_FACTORS

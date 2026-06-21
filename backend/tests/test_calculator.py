import unittest
from app.services.carbon_calculator import calculate_footprint
from app.models.schemas import ActivityItem, ActivityCategory

class TestCarbonCalculator(unittest.TestCase):
    def test_calculate_footprint_car(self):
        # 25 km car journey -> 25 * 0.192 = 4.8 kg CO2e
        activities = [
            ActivityItem(category=ActivityCategory.transport, type="car", quantity=25)
        ]
        result = calculate_footprint(activities)
        self.assertEqual(result.total_kg, 4.8)
        self.assertEqual(result.breakdown.transport_kg, 4.8)
        self.assertEqual(result.breakdown.food_kg, 0.0)

    def test_calculate_footprint_beef(self):
        # 1 beef meal -> 3.0 kg CO2e
        activities = [
            ActivityItem(category=ActivityCategory.food, type="beef", quantity=1)
        ]
        result = calculate_footprint(activities)
        self.assertEqual(result.total_kg, 3.0)
        self.assertEqual(result.breakdown.food_kg, 3.0)
        self.assertEqual(result.breakdown.transport_kg, 0.0)

    def test_calculate_footprint_combined(self):
        # Combined: 25 km car (4.8 kg) + 1 beef meal (3.0 kg) -> 7.8 kg CO2e
        activities = [
            ActivityItem(category=ActivityCategory.transport, type="car", quantity=25),
            ActivityItem(category=ActivityCategory.food, type="beef", quantity=1)
        ]
        result = calculate_footprint(activities)
        self.assertEqual(result.total_kg, 7.8)
        self.assertEqual(result.breakdown.transport_kg, 4.8)
        self.assertEqual(result.breakdown.food_kg, 3.0)
        self.assertEqual(result.hot_spot, "25.0 km by car")

if __name__ == "__main__":
    unittest.main()

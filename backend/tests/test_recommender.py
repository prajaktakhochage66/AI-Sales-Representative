import unittest

from app.recommender import recommend_products


class RecommendationTests(unittest.TestCase):
    def test_spray_drying_requirements_recommend_standard_60khz_nozzle(self):
        recommendations = recommend_products(
            viscosity_cp=50,
            flow_rate_ml_min=5,
            droplet_size_um=40,
            frequency_khz=60,
            application="Spray drying",
        )

        self.assertTrue(recommendations)
        self.assertEqual(recommendations[0]["id"], "SN-60K")


if __name__ == "__main__":
    unittest.main()

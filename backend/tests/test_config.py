import os
import unittest
from unittest.mock import patch

import app.config as config


class SettingsTests(unittest.TestCase):
    def test_blank_process_smtp_variables_fall_back_to_dotenv(self):
        dotenv_values = {
            "JWT_SECRET": "stable-test-secret",
            "SMTP_HOST": "smtp.example.invalid",
            "SMTP_PORT": "465",
            "SMTP_USERNAME": "sender@example.invalid",
            "SMTP_PASSWORD": "test-password",
            "SMTP_FROM_EMAIL": "sender@example.invalid",
        }
        with (
            patch.dict(
                os.environ,
                {
                    key: ""
                    for key in (
                        "SMTP_HOST",
                        "SMTP_PORT",
                        "SMTP_USERNAME",
                        "SMTP_PASSWORD",
                        "SMTP_FROM_EMAIL",
                        "JWT_SECRET",
                    )
                },
            ),
            patch.object(config, "dotenv_settings", dotenv_values),
        ):
            settings = config.Settings()

        self.assertTrue(settings.SMTP_CONFIGURED)
        self.assertEqual(settings.JWT_SECRET, "stable-test-secret")
        self.assertEqual(settings.SMTP_HOST, "smtp.example.invalid")
        self.assertEqual(settings.SMTP_PORT, 465)
        self.assertEqual(settings.SMTP_USERNAME, "sender@example.invalid")
        self.assertEqual(settings.SMTP_PASSWORD, "test-password")

    def test_nonempty_process_smtp_variables_take_precedence(self):
        with (
            patch.dict(
                os.environ,
                {
                    "SMTP_HOST": "smtp.process.invalid",
                    "SMTP_PORT": "2525",
                    "SMTP_USERNAME": "process@example.invalid",
                    "SMTP_PASSWORD": "process-password",
                    "SMTP_FROM_EMAIL": "process@example.invalid",
                    "JWT_SECRET": "process-jwt-secret",
                },
            ),
            patch.object(
                config,
                "dotenv_settings",
                {
                    "SMTP_HOST": "smtp.file.invalid",
                    "SMTP_PORT": "465",
                    "SMTP_USERNAME": "file@example.invalid",
                    "SMTP_PASSWORD": "file-password",
                    "SMTP_FROM_EMAIL": "file@example.invalid",
                    "JWT_SECRET": "file-jwt-secret",
                },
            ),
        ):
            settings = config.Settings()

        self.assertTrue(settings.SMTP_CONFIGURED)
        self.assertEqual(settings.JWT_SECRET, "process-jwt-secret")
        self.assertEqual(settings.SMTP_HOST, "smtp.process.invalid")
        self.assertEqual(settings.SMTP_PORT, 2525)
        self.assertEqual(settings.SMTP_USERNAME, "process@example.invalid")
        self.assertEqual(settings.SMTP_PASSWORD, "process-password")


if __name__ == "__main__":
    unittest.main()

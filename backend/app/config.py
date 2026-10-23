"""
config.py — Environment variable loading for WaveNxD AI Sales Rep Backend.

Uses python-dotenv to load variables from backend/.env
"""

import os
import sys
from dotenv import dotenv_values, load_dotenv

# Load the .env file from the backend directory
import pathlib
env_path = pathlib.Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)
dotenv_settings = dotenv_values(dotenv_path=env_path)


def _get_env_value(key: str, default: str = "") -> str:
    """Prefer non-empty process settings, falling back to backend/.env."""
    value = os.getenv(key, "").strip()
    if value:
        return value
    return (dotenv_settings.get(key) or default).strip()


def get_required_env(key: str) -> str:
    """Get a required environment variable or raise a clear error."""
    value = os.getenv(key, "").strip()
    if not value or value.startswith("PASTE_YOUR"):
        print(f"\n{'='*60}")
        print(f"❌  CONFIGURATION ERROR: '{key}' is not set.")
        print()
        print("   To fix this:")
        print("   1. Open the file:  backend/.env")
        print("   2. Replace 'PASTE_YOUR_API_KEY_HERE' with your real key.")
        print("   3. Get a free key at: https://aistudio.google.com/app/apikey")
        print("   4. Save the file and restart the backend.")
        print(f"{'='*60}\n")
        sys.exit(1)
    return value


def get_optional_env(key: str, default: str) -> str:
    """Get an optional environment variable with a default."""
    return os.getenv(key, default).strip() or default


# ── Exported settings ──────────────────────────────────────────────────────────

class Settings:
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash"
    API_KEY_CONFIGURED: bool = False
    JWT_SECRET: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""

    def __init__(self):
        raw_key = os.getenv("GEMINI_API_KEY", "").strip()
        if raw_key and not raw_key.startswith("PASTE_YOUR"):
            self.GEMINI_API_KEY = raw_key
            self.API_KEY_CONFIGURED = True
        else:
            self.GEMINI_API_KEY = ""
            self.API_KEY_CONFIGURED = False

        self.GEMINI_MODEL = get_optional_env("GEMINI_MODEL", "gemini-3.5-flash")
        self.JWT_SECRET = _get_env_value("JWT_SECRET")
        self.SMTP_HOST = _get_env_value("SMTP_HOST", "smtp.gmail.com")
        self.SMTP_PORT = int(_get_env_value("SMTP_PORT", "587"))
        self.SMTP_USERNAME = _get_env_value("SMTP_USERNAME")
        self.SMTP_PASSWORD = _get_env_value("SMTP_PASSWORD")
        self.SMTP_FROM_EMAIL = _get_env_value("SMTP_FROM_EMAIL") or self.SMTP_USERNAME

    @property
    def SMTP_CONFIGURED(self) -> bool:
        password_is_placeholder = self.SMTP_PASSWORD.upper().startswith(
            ("PASTE_", "REPLACE_")
        )
        return bool(
            self.SMTP_HOST
            and self.SMTP_PORT
            and self.SMTP_USERNAME
            and self.SMTP_PASSWORD
            and not password_is_placeholder
            and self.SMTP_FROM_EMAIL
        )


settings = Settings()

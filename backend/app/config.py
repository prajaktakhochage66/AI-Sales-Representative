"""
config.py — Environment variable loading for WaveNxD AI Sales Rep Backend.

Uses python-dotenv to load variables from backend/.env
"""

import os
import sys
from dotenv import load_dotenv

# Load the .env file from the backend directory
import pathlib
env_path = pathlib.Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)


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
    GEMINI_MODEL: str = "gemini-2.0-flash"
    API_KEY_CONFIGURED: bool = False

    def __init__(self):
        raw_key = os.getenv("GEMINI_API_KEY", "").strip()
        if raw_key and not raw_key.startswith("PASTE_YOUR"):
            self.GEMINI_API_KEY = raw_key
            self.API_KEY_CONFIGURED = True
        else:
            self.GEMINI_API_KEY = ""
            self.API_KEY_CONFIGURED = False

        self.GEMINI_MODEL = get_optional_env("GEMINI_MODEL", "gemini-3.8-flash")


settings = Settings()

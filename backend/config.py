"""
Environment configuration for the Seerah Tutor backend.
Loads and validates required environment variables at startup.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    SEERAH_DATA_PATH: Path = Path(__file__).parent / "data" / "seerah_pages.json"

    MAX_PAGES_PER_REQUEST: int = 8
    TOTAL_PAGES: int = 324  # The Sealed Nectar, English edition

    def validate(self) -> None:
        """Call once at startup — fail fast rather than at first request."""
        missing = []
        if not self.GEMINI_API_KEY:
            missing.append("GEMINI_API_KEY")
        if missing:
            raise RuntimeError(
                f"Missing required environment variables: {', '.join(missing)}"
            )


settings = Settings()

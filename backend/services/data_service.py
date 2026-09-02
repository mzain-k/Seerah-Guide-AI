"""
Loads the pre-processed Seerah page dictionary into memory and provides
exact-match page-range extraction. No embeddings, no similarity search —
just direct dictionary lookups, by design.
"""
import json
import logging
from pathlib import Path

from config import settings

logger = logging.getLogger(__name__)


class DataService:
    def __init__(self, data_path: Path = settings.SEERAH_DATA_PATH):
        self._data_path = data_path
        self._pages: dict[str, str] = {}
        self._loaded = False

    def load(self) -> None:
        """Load seerah_pages.json into memory. Call once at app startup."""
        if not self._data_path.exists():
            raise FileNotFoundError(
                f"Seerah data file not found at {self._data_path}. "
                "Run backend/scripts/preprocess_pdf.py first."
            )
        with open(self._data_path, "r", encoding="utf-8") as f:
            self._pages = json.load(f)
        self._loaded = True
        logger.info("Loaded %d pages from %s", len(self._pages), self._data_path)

    def get_page_range(self, start_page: int, end_page: int) -> str:
        """
        Extract and concatenate exact pages [start_page, end_page] inclusive.

        Raises KeyError if any requested page is missing — fails loudly
        rather than silently skipping a page, since a silent gap would
        corrupt the LLM's context without anyone noticing.
        """
        if not self._loaded:
            raise RuntimeError("DataService.load() must be called before use.")

        missing = [
            str(p) for p in range(start_page, end_page + 1)
            if str(p) not in self._pages
        ]
        if missing:
            raise KeyError(f"Missing page(s) in dataset: {', '.join(missing)}")

        chunks = [self._pages[str(p)] for p in range(start_page, end_page + 1)]
        return "\n\n".join(chunks)

    @property
    def total_pages(self) -> int:
        return len(self._pages)


# Singleton used across the app — loaded once at FastAPI startup.
data_service = DataService()

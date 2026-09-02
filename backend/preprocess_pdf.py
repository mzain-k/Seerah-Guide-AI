"""
One-time preprocessing script: converts the Sealed Nectar PDF into
backend/data/seerah_pages.json — a flat {page_number: page_text} dict.

Usage:
    python scripts/preprocess_pdf.py path/to/sealed_nectar.pdf

Run manually, once, before the backend is started. Not called at request time.
"""
import json
import sys
from pathlib import Path

import fitz  # PyMuPDF


def extract_pages(pdf_path: Path) -> dict[str, str]:
    doc = fitz.open(pdf_path)
    pages: dict[str, str] = {}
    for i, page in enumerate(doc, start=1):
        text = page.get_text("text").strip()
        pages[str(i)] = text
    doc.close()
    return pages


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python preprocess_pdf.py <path_to_pdf>")
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(f"File not found: {pdf_path}")
        sys.exit(1)

    output_path = Path(__file__).parent.parent / "data" / "seerah_pages.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    pages = extract_pages(pdf_path)

    empty_pages = [p for p, text in pages.items() if not text]
    if empty_pages:
        print(
            f"Warning: {len(empty_pages)} page(s) extracted with no text "
            f"(likely images/scans, needs manual check): {', '.join(empty_pages)}"
        )

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(pages, f, ensure_ascii=False, indent=2)

    print(f"Extracted {len(pages)} pages -> {output_path}")


if __name__ == "__main__":
    main()

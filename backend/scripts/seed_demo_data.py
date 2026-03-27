import argparse
from pathlib import Path

import httpx


DEFAULT_FILES = [
    Path("../../demo-data/filings/apple-2024-10k.txt"),
    Path("../../demo-data/filings/tesla-2024-10k.txt"),
]

DOCUMENT_METADATA = {
    "apple-2024-10k.txt": {
        "company": "Apple",
        "filing_type": "10-K",
        "filing_date": "2024-11-01",
    },
    "tesla-2024-10k.txt": {
        "company": "Tesla",
        "filing_type": "10-K",
        "filing_date": "2024-02-01",
    },
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed FinRAG with demo Apple and Tesla filings.")
    parser.add_argument("--api-url", default="http://localhost:8000", help="FinRAG backend URL")
    args = parser.parse_args()

    scripts_dir = Path(__file__).resolve().parent

    for relative_path in DEFAULT_FILES:
        file_path = (scripts_dir / relative_path).resolve()
        metadata = DOCUMENT_METADATA[file_path.name]
        with file_path.open("rb") as file_handle:
            response = httpx.post(
                f"{args.api_url.rstrip('/')}/documents/upload",
                files={"file": (file_path.name, file_handle, "text/plain")},
                data=metadata,
                timeout=60.0,
            )
        response.raise_for_status()
        payload = response.json()
        print(f"Seeded {payload['filename']} -> status {payload['status']} ({payload['id']})")


if __name__ == "__main__":
    main()

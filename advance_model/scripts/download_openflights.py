"""
Skylytics — OpenFlights Data Downloader
========================================
Downloads airports.dat and routes.dat from the OpenFlights GitHub repository.

These are static CSV files — no API key needed.

Usage:
    python download_openflights.py

Output:
    Dataset/raw/openflights/airports.dat
    Dataset/raw/openflights/routes.dat
"""

import os
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 'requests' library not found. Install it with: pip install requests")
    sys.exit(1)

import pandas as pd


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / "backend" / "Dataset" / "raw" / "openflights"

FILES = {
    "airports.dat": {
        "url": "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat",
        "columns": [
            "airport_id", "name", "city", "country", "iata", "icao",
            "latitude", "longitude", "altitude", "timezone_offset",
            "dst", "timezone", "type", "source"
        ],
        "description": "Airport metadata (lat/lon, timezone, country) for all world airports",
    },
    "routes.dat": {
        "url": "https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat",
        "columns": [
            "airline", "airline_id", "source_airport", "source_airport_id",
            "dest_airport", "dest_airport_id", "codeshare", "stops", "equipment"
        ],
        "description": "Airline routes (source → dest), codeshares, stops",
    },
}


# ---------------------------------------------------------------------------
# Download Logic
# ---------------------------------------------------------------------------

def download_file(name: str, config: dict) -> bool:
    """Download a single OpenFlights data file."""
    output_file = OUTPUT_DIR / name
    url = config["url"]

    if output_file.exists():
        size_kb = output_file.stat().st_size / 1024
        print(f"  [SKIP] {name} — already exists ({size_kb:.0f} KB)")
        return True

    print(f"  [GET]  {name}")
    print(f"         {config['description']}")
    print(f"         URL: {url}")

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        # Save raw file
        with open(output_file, "wb") as f:
            f.write(response.content)

        size_kb = len(response.content) / 1024
        print(f"  [OK]   {name} — {size_kb:.0f} KB downloaded")

        # Parse and show summary
        try:
            df = pd.read_csv(
                output_file,
                header=None,
                names=config["columns"],
                na_values=["\\N", ""],
                encoding="utf-8",
            )
            print(f"         Rows: {len(df):,} | Columns: {len(df.columns)}")

            if "iata" in df.columns:
                # For airports: show US airport count
                us_airports = df[df["country"] == "United States"]
                valid_iata = us_airports["iata"].dropna()
                print(f"         US airports with IATA code: {len(valid_iata)}")

            if "source_airport" in df.columns:
                print(f"         Unique routes: {len(df):,}")
                print(f"         Unique airlines: {df['airline'].nunique()}")

        except Exception as e:
            print(f"         (Could not parse for summary: {e})")

        return True

    except requests.exceptions.RequestException as e:
        print(f"  [ERR]  {name} — {type(e).__name__}: {e}")
        return False


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"  Skylytics — OpenFlights Data Downloader")
    print(f"  Output: {OUTPUT_DIR}")
    print(f"{'='*60}\n")

    success = 0
    for name, config in FILES.items():
        if download_file(name, config):
            success += 1
        print()

    print(f"{'='*60}")
    print(f"  Done! {success}/{len(FILES)} files downloaded.")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

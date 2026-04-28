"""
Skylytics — BTS On-Time Performance Data Downloader
=====================================================
Downloads flight delay data from transtats.bts.gov for years 2024–2025.

Uses the PREZIP direct-download URL pattern:
  https://transtats.bts.gov/PREZIP/On_Time_Reporting_Carrier_On_Time_Performance_1987_present_{YEAR}_{MONTH}.zip

Each zip contains a CSV with ~500K+ rows per month.

Usage:
    python download_bts.py                      # Download 2024-2025
    python download_bts.py --start 2024 --end 2025  # Download specific range
    python download_bts.py --start 2024 --end 2024 --months 1 2 3  # Specific months

Output:
    Dataset/raw/bts/bts_YYYY_MM.csv  (one file per month)
    Dataset/raw/bts/download_log.json (tracks what's been downloaded)
"""

import os
import sys
import json
import time
import zipfile
import argparse
import io
from pathlib import Path
from datetime import datetime

try:
    import requests
except ImportError:
    print("ERROR: 'requests' library not found. Install it with: pip install requests")
    sys.exit(1)

try:
    import pandas as pd
except ImportError:
    pd = None  # Optional — used for column mapping verification only


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL = (
    "https://transtats.bts.gov/PREZIP/"
    "On_Time_Reporting_Carrier_On_Time_Performance_1987_present_{year}_{month}.zip"
)

# Where raw BTS data lands (relative to project root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent  # advance_model/scripts/ → project root
OUTPUT_DIR = PROJECT_ROOT / "backend" / "Dataset" / "raw" / "bts"
LOG_FILE = OUTPUT_DIR / "download_log.json"

# Column mapping: BTS transtats names → Kaggle 2015 names (our standard)
# BTS transtats CSVs have different column names than the Kaggle download.
# This mapping ensures consistency across all years.
BTS_TO_KAGGLE = {
    "Year": "YEAR",
    "Quarter": "QUARTER",
    "Month": "MONTH",
    "DayofMonth": "DAY",
    "DayOfWeek": "DAY_OF_WEEK",
    "FlightDate": "FL_DATE",
    "Reporting_Airline": "AIRLINE",
    "DOT_ID_Reporting_Airline": "DOT_ID_AIRLINE",
    "IATA_CODE_Reporting_Airline": "IATA_CODE_AIRLINE",
    "Tail_Number": "TAIL_NUMBER",
    "Flight_Number_Reporting_Airline": "FLIGHT_NUMBER",
    "OriginAirportID": "ORIGIN_AIRPORT_ID",
    "OriginAirportSeqID": "ORIGIN_AIRPORT_SEQ_ID",
    "OriginCityMarketID": "ORIGIN_CITY_MARKET_ID",
    "Origin": "ORIGIN_AIRPORT",
    "OriginCityName": "ORIGIN_CITY_NAME",
    "OriginState": "ORIGIN_STATE",
    "OriginStateFips": "ORIGIN_STATE_FIPS",
    "OriginStateName": "ORIGIN_STATE_NAME",
    "OriginWac": "ORIGIN_WAC",
    "DestAirportID": "DEST_AIRPORT_ID",
    "DestAirportSeqID": "DEST_AIRPORT_SEQ_ID",
    "DestCityMarketID": "DEST_CITY_MARKET_ID",
    "Dest": "DESTINATION_AIRPORT",
    "DestCityName": "DEST_CITY_NAME",
    "DestState": "DEST_STATE",
    "DestStateFips": "DEST_STATE_FIPS",
    "DestStateName": "DEST_STATE_NAME",
    "DestWac": "DEST_WAC",
    "CRSDepTime": "SCHEDULED_DEPARTURE",
    "DepTime": "DEPARTURE_TIME",
    "DepDelay": "DEPARTURE_DELAY",
    "DepDelayMinutes": "DEPARTURE_DELAY_MINUTES",
    "DepDel15": "DEP_DEL15",
    "DepartureDelayGroups": "DEPARTURE_DELAY_GROUPS",
    "DepTimeBlk": "DEP_TIME_BLK",
    "TaxiOut": "TAXI_OUT",
    "WheelsOff": "WHEELS_OFF",
    "WheelsOn": "WHEELS_ON",
    "TaxiIn": "TAXI_IN",
    "CRSArrTime": "SCHEDULED_ARRIVAL",
    "ArrTime": "ARRIVAL_TIME",
    "ArrDelay": "ARRIVAL_DELAY",
    "ArrDelayMinutes": "ARRIVAL_DELAY_MINUTES",
    "ArrDel15": "ARR_DEL15",
    "ArrivalDelayGroups": "ARRIVAL_DELAY_GROUPS",
    "ArrTimeBlk": "ARR_TIME_BLK",
    "Cancelled": "CANCELLED",
    "CancellationCode": "CANCELLATION_REASON",
    "Diverted": "DIVERTED",
    "CRSElapsedTime": "SCHEDULED_TIME",
    "ActualElapsedTime": "ELAPSED_TIME",
    "AirTime": "AIR_TIME",
    "Flights": "FLIGHTS",
    "Distance": "DISTANCE",
    "DistanceGroup": "DISTANCE_GROUP",
    "CarrierDelay": "AIRLINE_DELAY",
    "WeatherDelay": "WEATHER_DELAY",
    "NASDelay": "AIR_SYSTEM_DELAY",
    "SecurityDelay": "SECURITY_DELAY",
    "LateAircraftDelay": "LATE_AIRCRAFT_DELAY",
}

# These are the columns we actually need (matching our Kaggle 2015 schema)
KEEP_COLUMNS = [
    "YEAR", "MONTH", "DAY", "DAY_OF_WEEK", "AIRLINE", "FLIGHT_NUMBER",
    "TAIL_NUMBER", "ORIGIN_AIRPORT", "DESTINATION_AIRPORT",
    "SCHEDULED_DEPARTURE", "DEPARTURE_TIME", "DEPARTURE_DELAY",
    "TAXI_OUT", "WHEELS_OFF", "SCHEDULED_TIME", "ELAPSED_TIME",
    "AIR_TIME", "DISTANCE", "WHEELS_ON", "TAXI_IN",
    "SCHEDULED_ARRIVAL", "ARRIVAL_TIME", "ARRIVAL_DELAY",
    "DIVERTED", "CANCELLED", "CANCELLATION_REASON",
    "AIR_SYSTEM_DELAY", "SECURITY_DELAY", "AIRLINE_DELAY",
    "LATE_AIRCRAFT_DELAY", "WEATHER_DELAY",
]


# ---------------------------------------------------------------------------
# Download Logic
# ---------------------------------------------------------------------------

def load_download_log() -> dict:
    """Load the download log to track what's already been downloaded."""
    if LOG_FILE.exists():
        with open(LOG_FILE, "r") as f:
            return json.load(f)
    return {"downloads": {}, "last_updated": None}


def save_download_log(log: dict):
    """Save the download log."""
    log["last_updated"] = datetime.now().isoformat()
    with open(LOG_FILE, "w") as f:
        json.dump(log, f, indent=2)


def download_month(year: int, month: int, session: requests.Session, log: dict) -> bool:
    """
    Download a single month of BTS data.

    Returns True if successful, False otherwise.
    """
    key = f"{year}_{month:02d}"
    output_file = OUTPUT_DIR / f"bts_{key}.csv"

    # Skip if already downloaded
    if key in log["downloads"] and output_file.exists():
        print(f"  [SKIP] {key} — already downloaded ({log['downloads'][key]['rows']:,} rows)")
        return True

    url = BASE_URL.format(year=year, month=month)
    print(f"  [GET]  {key} — {url}")

    try:
        response = session.get(url, timeout=120, stream=True)

        if response.status_code == 404:
            print(f"  [MISS] {key} — 404 Not Found (data may not be available yet)")
            log["downloads"][key] = {"status": "not_available", "timestamp": datetime.now().isoformat()}
            return False

        response.raise_for_status()

        # Read the zip content
        content = response.content
        content_size_mb = len(content) / (1024 * 1024)
        print(f"         Downloaded {content_size_mb:.1f} MB")

        # Extract CSV from zip
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            csv_files = [f for f in zf.namelist() if f.endswith(".csv")]
            if not csv_files:
                print(f"  [ERR]  {key} — No CSV found in zip (files: {zf.namelist()})")
                return False

            csv_name = csv_files[0]
            print(f"         Extracting: {csv_name}")

            with zf.open(csv_name) as csv_file:
                if pd is not None:
                    # Use pandas for column mapping
                    df = pd.read_csv(csv_file, encoding="latin-1", low_memory=False)

                    # Rename columns to our standard
                    df = df.rename(columns=BTS_TO_KAGGLE)

                    # Keep only the columns we need (if they exist)
                    available_cols = [c for c in KEEP_COLUMNS if c in df.columns]
                    missing_cols = [c for c in KEEP_COLUMNS if c not in df.columns]

                    if missing_cols:
                        print(f"         ⚠ Missing columns: {missing_cols}")

                    df = df[available_cols]
                    row_count = len(df)

                    # Save
                    df.to_csv(output_file, index=False)
                else:
                    # Without pandas: just save raw CSV
                    raw_data = csv_file.read()
                    with open(output_file, "wb") as out:
                        out.write(raw_data)
                    row_count = raw_data.count(b"\n") - 1  # Approximate

        print(f"  [OK]   {key} — {row_count:,} rows → {output_file.name}")

        log["downloads"][key] = {
            "status": "success",
            "rows": row_count,
            "file": str(output_file.name),
            "size_mb": round(content_size_mb, 1),
            "timestamp": datetime.now().isoformat(),
        }
        return True

    except requests.exceptions.Timeout:
        print(f"  [ERR]  {key} — Timeout after 120s")
        log["downloads"][key] = {"status": "timeout", "timestamp": datetime.now().isoformat()}
        return False

    except requests.exceptions.RequestException as e:
        print(f"  [ERR]  {key} — {type(e).__name__}: {e}")
        log["downloads"][key] = {"status": "error", "error": str(e), "timestamp": datetime.now().isoformat()}
        return False

    except zipfile.BadZipFile:
        print(f"  [ERR]  {key} — Bad zip file (server may have returned an error page)")
        log["downloads"][key] = {"status": "bad_zip", "timestamp": datetime.now().isoformat()}
        return False


def download_range(start_year: int, end_year: int, months: list = None):
    """
    Download BTS data for a range of years and months.

    Parameters
    ----------
    start_year : int
    end_year : int
    months : list of int, optional
        Specific months to download (1-12). Defaults to all 12.
    """
    if months is None:
        months = list(range(1, 13))

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    log = load_download_log()

    total_files = (end_year - start_year + 1) * len(months)
    success_count = 0
    skip_count = 0
    fail_count = 0

    print(f"\n{'='*60}")
    print(f"  Skylytics — BTS Data Downloader")
    print(f"  Range: {start_year} → {end_year} | Months: {months}")
    print(f"  Total files: {total_files}")
    print(f"  Output: {OUTPUT_DIR}")
    print(f"{'='*60}\n")

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Skylytics-FYP/1.0 (Academic Research Project)"
    })

    for year in range(start_year, end_year + 1):
        print(f"\n--- Year {year} ---")
        for month in months:
            key = f"{year}_{month:02d}"

            # Check if already done
            if key in log["downloads"] and log["downloads"][key].get("status") == "success":
                output_file = OUTPUT_DIR / f"bts_{key}.csv"
                if output_file.exists():
                    print(f"  [SKIP] {key} — already downloaded")
                    skip_count += 1
                    continue

            result = download_month(year, month, session, log)

            if result:
                success_count += 1
            else:
                fail_count += 1

            # Save log after each download (resume-safe)
            save_download_log(log)

            # Rate limiting: be polite to the government server
            time.sleep(2)

    # Summary
    print(f"\n{'='*60}")
    print(f"  Download Complete!")
    print(f"  ✅ Success: {success_count}")
    print(f"  ⏭  Skipped: {skip_count}")
    print(f"  ❌ Failed:  {fail_count}")
    print(f"{'='*60}")

    # List all downloaded files
    csv_files = sorted(OUTPUT_DIR.glob("bts_*.csv"))
    if csv_files:
        total_size = sum(f.stat().st_size for f in csv_files) / (1024 * 1024 * 1024)
        print(f"\n  Files in {OUTPUT_DIR}:")
        for f in csv_files:
            size_mb = f.stat().st_size / (1024 * 1024)
            print(f"    {f.name:30s}  {size_mb:>8.1f} MB")
        print(f"    {'─'*40}")
        print(f"    {'Total':30s}  {total_size:>8.2f} GB")

    return log


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Download BTS On-Time Performance data from transtats.bts.gov"
    )
    parser.add_argument(
        "--start", type=int, default=2024,
        help="Start year (default: 2024)"
    )
    parser.add_argument(
        "--end", type=int, default=2025,
        help="End year (default: 2025)"
    )
    parser.add_argument(
        "--months", type=int, nargs="+", default=None,
        help="Specific months to download (default: all 1-12)"
    )
    parser.add_argument(
        "--test", action="store_true",
        help="Test mode: download only January 2024"
    )

    args = parser.parse_args()

    if args.test:
        print("TEST MODE: Downloading only January 2024")
        download_range(2024, 2024, months=[1])
    else:
        download_range(args.start, args.end, months=args.months)


if __name__ == "__main__":
    main()

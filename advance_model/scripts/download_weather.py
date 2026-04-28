"""
Skylytics — Meteostat Weather Data Downloader
===============================================
Pulls historical hourly weather data for each origin airport
in the BTS flight dataset using the Meteostat Python library.

Strategy:
    1. Load all unique ORIGIN_AIRPORT codes from flights.csv
    2. Map each IATA code → lat/lon using airports.csv
    3. For each airport, pull hourly weather from Meteostat for the flight date range
    4. Save to Dataset/raw/weather/ as Parquet files (one per airport)

Rate Limit Handling:
    - Meteostat free tier has rate limits
    - Script caches per-airport data and skips already-downloaded airports
    - 1-second delay between API calls

Usage:
    python download_weather.py                    # All airports, full date range
    python download_weather.py --top 50           # Top 50 busiest airports only
    python download_weather.py --test             # Test with just 5 airports
    python download_weather.py --year 2024        # Only 2024 data
    python download_weather.py --start 2024 --end 2025  # Date range

Prerequisites:
    pip install meteostat pandas pyarrow

Output:
    Dataset/raw/weather/{IATA}.parquet  (one file per airport)
    Dataset/raw/weather/station_mapping.json
    Dataset/raw/weather/download_log.json
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from datetime import datetime

try:
    import pandas as pd
except ImportError:
    print("ERROR: 'pandas' not found. Install it with: pip install pandas")
    sys.exit(1)

try:
    from meteostat import Point, hourly as Hourly, config
    config.block_large_requests = False
    METEOSTAT_AVAILABLE = True
except ImportError:
    METEOSTAT_AVAILABLE = False
    print("WARNING: 'meteostat' library not found.")
    print("Install it with: pip install meteostat")
    print("Continuing in dry-run mode (will show what WOULD be downloaded).\n")


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATASET_DIR = PROJECT_ROOT / "backend" / "Dataset"
FLIGHTS_CSV = DATASET_DIR / "flights.csv"
AIRPORTS_CSV = DATASET_DIR / "airports.csv"
OUTPUT_DIR = DATASET_DIR / "raw" / "weather"
STATION_MAP_FILE = OUTPUT_DIR / "station_mapping.json"
LOG_FILE = OUTPUT_DIR / "download_log.json"

# Weather columns we want from Meteostat
WEATHER_COLUMNS = {
    "temp": "Temperature (°C)",
    "dwpt": "Dew Point (°C)",
    "rhum": "Relative Humidity (%)",
    "prcp": "Precipitation (mm)",
    "snow": "Snow Depth (mm)",
    "wdir": "Wind Direction (°)",
    "wspd": "Wind Speed (km/h)",
    "wpgt": "Wind Gust (km/h)",
    "pres": "Pressure (hPa)",
    "coco": "Weather Condition Code",
}


# ---------------------------------------------------------------------------
# Airport Loading
# ---------------------------------------------------------------------------

def load_airport_coords() -> dict:
    """
    Load airport IATA → (lat, lon) mapping from airports.csv.

    Returns
    -------
    dict
        {IATA_CODE: (latitude, longitude)}
    """
    if not AIRPORTS_CSV.exists():
        print(f"ERROR: airports.csv not found at {AIRPORTS_CSV}")
        sys.exit(1)

    df = pd.read_csv(AIRPORTS_CSV)
    coords = {}
    for _, row in df.iterrows():
        iata = str(row["IATA_CODE"]).strip()
        lat = row.get("LATITUDE")
        lon = row.get("LONGITUDE")
        if pd.notna(lat) and pd.notna(lon) and len(iata) == 3:
            coords[iata] = (float(lat), float(lon))

    print(f"  Loaded {len(coords)} airport coordinates from airports.csv")
    return coords


def get_origin_airports(top_n: int = None) -> list:
    """
    Get unique origin airports from flights.csv AND all raw bts csv files, 
    optionally limited to top N busiest.

    Returns
    -------
    list of str
        IATA codes sorted by flight count (descending).
    """
    print(f"  Scanning datasets for unique origin airports...")

    origins_series = []

    # 1. Read base 2015 flights
    if FLIGHTS_CSV.exists():
        df = pd.read_csv(FLIGHTS_CSV, usecols=["ORIGIN_AIRPORT"], dtype={"ORIGIN_AIRPORT": str})
        origins_series.append(df["ORIGIN_AIRPORT"])

    # 2. Read downloaded 2016-2025 flights
    bts_dir = DATASET_DIR / "raw" / "bts"
    if bts_dir.exists():
        for csv_file in bts_dir.glob("bts_*.csv"):
            try:
                df = pd.read_csv(csv_file, usecols=["ORIGIN_AIRPORT"], dtype={"ORIGIN_AIRPORT": str})
                origins_series.append(df["ORIGIN_AIRPORT"])
            except Exception as e:
                print(f"    [WARN] Could not read ORIGIN_AIRPORT from {csv_file.name}: {e}")

    if not origins_series:
        print("ERROR: No flight data found to extract airports.")
        sys.exit(1)

    # Combine and count flights per airport
    combined = pd.concat(origins_series)
    counts = combined.value_counts()

    # Filter to valid IATA codes (3 uppercase letters)
    valid = counts[counts.index.str.match(r'^[A-Z]{3}$', na=False)]

    if top_n:
        valid = valid.head(top_n)

    airports = valid.index.tolist()
    print(f"  Found {len(airports)} unique origin airports")
    if top_n:
        print(f"  (limited to top {top_n} busiest)")

    # Show top 10
    print(f"\n  Top 10 busiest:")
    for iata, count in valid.head(10).items():
        print(f"    {iata}: {count:>10,} flights")

    return airports


# ---------------------------------------------------------------------------
# Download Logic
# ---------------------------------------------------------------------------

def load_log() -> dict:
    if LOG_FILE.exists():
        with open(LOG_FILE, "r") as f:
            return json.load(f)
    return {"airports": {}, "last_updated": None}


def save_log(log: dict):
    log["last_updated"] = datetime.now().isoformat()
    with open(LOG_FILE, "w") as f:
        json.dump(log, f, indent=2)


def download_airport_weather(
    iata: str,
    lat: float,
    lon: float,
    start_date: datetime,
    end_date: datetime,
    log: dict,
) -> bool:
    """
    Download hourly weather for a single airport.

    Returns True if successful.
    """
    output_file = OUTPUT_DIR / f"{iata}.parquet"

    # Skip if already downloaded
    if iata in log["airports"] and log["airports"][iata].get("status") == "success":
        if output_file.exists():
            print(f"  [SKIP] {iata} — already downloaded")
            return True

    print(f"  [GET]  {iata} (lat={lat:.4f}, lon={lon:.4f})")

    if not METEOSTAT_AVAILABLE:
        print(f"         [DRY RUN] Would fetch {start_date.date()} → {end_date.date()}")
        return False

    try:
        # Create a Point for the airport location
        location = Point(lat, lon)

        # Fetch hourly data
        data = Hourly(location, start_date, end_date)
        data = data.fetch()

        if data is None or data.empty:
            print(f"  [WARN] {iata} — No weather data returned")
            log["airports"][iata] = {
                "status": "no_data",
                "lat": lat, "lon": lon,
                "timestamp": datetime.now().isoformat(),
            }
            return False

        # Add airport identifier
        data["airport_iata"] = iata

        # Save as Parquet
        data.to_parquet(output_file)

        rows = len(data)
        cols_with_data = data.notna().sum()
        coverage = {col: f"{(cols_with_data[col]/rows*100):.0f}%" for col in WEATHER_COLUMNS if col in data.columns}

        print(f"  [OK]   {iata} — {rows:,} hourly records")
        print(f"         Coverage: {coverage}")

        log["airports"][iata] = {
            "status": "success",
            "rows": rows,
            "file": output_file.name,
            "lat": lat, "lon": lon,
            "date_range": f"{start_date.date()} → {end_date.date()}",
            "timestamp": datetime.now().isoformat(),
        }
        return True

    except Exception as e:
        print(f"  [ERR]  {iata} — {type(e).__name__}: {e}")
        log["airports"][iata] = {
            "status": "error",
            "error": str(e),
            "lat": lat, "lon": lon,
            "timestamp": datetime.now().isoformat(),
        }
        return False


def download_all(
    top_n: int = None,
    start_year: int = 2024,
    end_year: int = 2025,
    test_mode: bool = False,
):
    """
    Download weather data for all origin airports.
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    log = load_log()

    # 1. Get airports
    if test_mode:
        airports = ["ATL", "ORD", "DFW", "DEN", "LAX"]
        print(f"\n  TEST MODE: Using {len(airports)} airports: {airports}")
    else:
        airports = get_origin_airports(top_n=top_n)

    # 2. Get coordinates
    coords = load_airport_coords()

    # 3. Date range
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31, 23, 59)

    # 4. Filter to airports with known coordinates
    valid_airports = [(a, coords[a]) for a in airports if a in coords]
    missing = [a for a in airports if a not in coords]
    if missing:
        print(f"\n  ⚠ {len(missing)} airports have no coordinates: {missing[:10]}{'...' if len(missing)>10 else ''}")

    print(f"\n{'='*60}")
    print(f"  Skylytics — Meteostat Weather Downloader")
    print(f"  Airports: {len(valid_airports)}")
    print(f"  Date range: {start_date.date()} → {end_date.date()}")
    print(f"  Output: {OUTPUT_DIR}")
    print(f"{'='*60}\n")

    # 5. Download
    success = 0
    skip = 0
    fail = 0

    # Save station mapping
    station_map = {iata: {"lat": lat, "lon": lon} for iata, (lat, lon) in valid_airports}
    with open(STATION_MAP_FILE, "w") as f:
        json.dump(station_map, f, indent=2)

    for i, (iata, (lat, lon)) in enumerate(valid_airports, 1):
        print(f"\n  [{i}/{len(valid_airports)}]")
        result = download_airport_weather(iata, lat, lon, start_date, end_date, log)

        if result:
            if iata in log["airports"] and log["airports"][iata].get("status") == "success":
                # Check if it was a skip (already had data) vs fresh download
                success += 1
        else:
            fail += 1

        # Save log after each airport (resume-safe)
        save_log(log)

        # Rate limiting
        if METEOSTAT_AVAILABLE and result:
            time.sleep(1)

    # Summary
    print(f"\n{'='*60}")
    print(f"  Download Complete!")
    print(f"  ✅ Success: {success}")
    print(f"  ❌ Failed:  {fail}")
    print(f"{'='*60}")

    # List files
    parquet_files = sorted(OUTPUT_DIR.glob("*.parquet"))
    if parquet_files:
        total_size = sum(f.stat().st_size for f in parquet_files) / (1024 * 1024)
        print(f"\n  Parquet files in {OUTPUT_DIR}: {len(parquet_files)}")
        print(f"  Total size: {total_size:.1f} MB")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Download Meteostat weather data for BTS airports")
    parser.add_argument("--top", type=int, default=None, help="Only download for top N busiest airports")
    parser.add_argument("--test", action="store_true", help="Test mode: 5 airports only")
    parser.add_argument("--start", type=int, default=2024, help="Start year (default: 2024)")
    parser.add_argument("--end", type=int, default=2025, help="End year (default: 2025)")
    parser.add_argument("--year", type=int, default=None, help="Single year shortcut")

    args = parser.parse_args()

    if args.year:
        args.start = args.year
        args.end = args.year

    download_all(
        top_n=args.top,
        start_year=args.start,
        end_year=args.end,
        test_mode=args.test,
    )


if __name__ == "__main__":
    main()

"""
Seed script — populates airports and airlines tables from CSV files.
Run: ./venv/bin/python seed.py
"""
import uuid
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

DB = "dbname=skylytics user=postgres password=postgres host=localhost port=5432"

AIRPORTS_CSV = "../Dataset/airports.csv"
AIRLINES_CSV = "../Dataset/airlines.csv"

# Basic US state → timezone mapping
STATE_TZ = {
    "AL": "America/Chicago",   "AK": "America/Anchorage", "AZ": "America/Phoenix",
    "AR": "America/Chicago",   "CA": "America/Los_Angeles","CO": "America/Denver",
    "CT": "America/New_York",  "DE": "America/New_York",  "FL": "America/New_York",
    "GA": "America/New_York",  "HI": "Pacific/Honolulu",  "ID": "America/Denver",
    "IL": "America/Chicago",   "IN": "America/Indiana/Indianapolis",
    "IA": "America/Chicago",   "KS": "America/Chicago",   "KY": "America/New_York",
    "LA": "America/Chicago",   "ME": "America/New_York",  "MD": "America/New_York",
    "MA": "America/New_York",  "MI": "America/Detroit",   "MN": "America/Chicago",
    "MS": "America/Chicago",   "MO": "America/Chicago",   "MT": "America/Denver",
    "NE": "America/Chicago",   "NV": "America/Los_Angeles","NH": "America/New_York",
    "NJ": "America/New_York",  "NM": "America/Denver",    "NY": "America/New_York",
    "NC": "America/New_York",  "ND": "America/Chicago",   "OH": "America/New_York",
    "OK": "America/Chicago",   "OR": "America/Los_Angeles","PA": "America/New_York",
    "RI": "America/New_York",  "SC": "America/New_York",  "SD": "America/Chicago",
    "TN": "America/Chicago",   "TX": "America/Chicago",   "UT": "America/Denver",
    "VT": "America/New_York",  "VA": "America/New_York",  "WA": "America/Los_Angeles",
    "WV": "America/New_York",  "WI": "America/Chicago",   "WY": "America/Denver",
    "DC": "America/New_York",  "PR": "America/Puerto_Rico","GU": "Pacific/Guam",
    "VI": "America/St_Thomas",
}


def seed_airports(cur):
    df = pd.read_csv(AIRPORTS_CSV)
    df.columns = [c.strip() for c in df.columns]
    df = df.dropna(subset=["IATA_CODE", "LATITUDE", "LONGITUDE"])

    rows = []
    for _, row in df.iterrows():
        iata = str(row["IATA_CODE"]).strip().upper()
        if not iata or len(iata) > 3:
            continue
        state = str(row.get("STATE", "")).strip().upper()
        tz = STATE_TZ.get(state, "UTC")
        rows.append((
            str(uuid.uuid4()),
            iata,
            None,                             # icao — not in CSV
            str(row["AIRPORT"]).strip(),
            str(row["CITY"]).strip(),
            str(row.get("COUNTRY", "USA")).strip(),
            float(row["LATITUDE"]),
            float(row["LONGITUDE"]),
            tz,
            None,                             # elevation_ft — not in CSV
        ))

    execute_values(cur, """
        INSERT INTO airports (id, iata, icao, name, city, country, latitude, longitude, timezone, elevation_ft)
        VALUES %s
        ON CONFLICT (iata) DO NOTHING
    """, rows)
    print(f"  Airports: {len(rows)} rows inserted (duplicates skipped)")


def seed_airlines(cur):
    df = pd.read_csv(AIRLINES_CSV)
    df.columns = [c.strip() for c in df.columns]
    df = df.dropna(subset=["IATA_CODE", "AIRLINE"])

    rows = []
    for _, row in df.iterrows():
        iata = str(row["IATA_CODE"]).strip().upper()
        if not iata or len(iata) > 2:
            continue
        rows.append((
            str(uuid.uuid4()),
            iata,
            None,                             # icao — not in CSV
            str(row["AIRLINE"]).strip(),
            None,                             # country — not in CSV
            None,                             # logo_url — not in CSV
        ))

    execute_values(cur, """
        INSERT INTO airlines (id, iata, icao, name, country, logo_url)
        VALUES %s
        ON CONFLICT (iata) DO NOTHING
    """, rows)
    print(f"  Airlines: {len(rows)} rows inserted (duplicates skipped)")


def main():
    print("Connecting to database...")
    conn = psycopg2.connect(DB)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        print("Seeding airports...")
        seed_airports(cur)

        print("Seeding airlines...")
        seed_airlines(cur)

        conn.commit()
        print("\nDone. Verifying row counts:")
        cur.execute("SELECT COUNT(*) FROM airports")
        print(f"  airports: {cur.fetchone()[0]} rows")
        cur.execute("SELECT COUNT(*) FROM airlines")
        print(f"  airlines: {cur.fetchone()[0]} rows")

    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()

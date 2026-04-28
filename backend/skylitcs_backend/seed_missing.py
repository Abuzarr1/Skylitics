"""
Seed missing tables: aircraft, flight_events, notification_preferences
Run: ./venv/bin/python seed_missing.py
"""
import uuid
import random
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timezone, timedelta

DB = "dbname=skylytics user=postgres password=postgres host=localhost port=5432"

conn = psycopg2.connect(DB)
cur = conn.cursor()

# ─────────────────────────────────────────────
# 1. AIRCRAFT
# ─────────────────────────────────────────────
print("Seeding aircraft...")

FLEET = [
    # (icao_type, model, capacity)
    ("B738", "Boeing 737-800",      189),
    ("B739", "Boeing 737-900",      215),
    ("B77W", "Boeing 777-300ER",    396),
    ("B788", "Boeing 787-8",        242),
    ("B789", "Boeing 787-9",        296),
    ("A319", "Airbus A319",         128),
    ("A320", "Airbus A320",         150),
    ("A321", "Airbus A321",         185),
    ("A333", "Airbus A330-300",     277),
    ("A359", "Airbus A350-900",     325),
    ("E175", "Embraer E175",         76),
    ("E190", "Embraer E190",         97),
    ("CRJ9", "Bombardier CRJ-900",   76),
    ("DH8D", "Bombardier Q400",      74),
    ("B752", "Boeing 757-200",      200),
]

REGISTRATION_PREFIXES = ["N", "N", "N", "N", "N"]  # US tail numbers all start with N

aircraft_rows = []
for i in range(60):
    icao, model, cap = FLEET[i % len(FLEET)]
    reg_num = random.randint(10000, 99999)
    reg = f"N{reg_num}{random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ')}"
    aircraft_rows.append((
        str(uuid.uuid4()),
        icao,
        reg,
        model,
        cap,
    ))

execute_values(cur,
    "INSERT INTO aircraft (id, icao_type, registration, model, capacity) VALUES %s ON CONFLICT DO NOTHING",
    aircraft_rows
)
print(f"  Inserted {len(aircraft_rows)} aircraft")

# Assign aircraft to flights that currently have aircraft_id = NULL
cur.execute("SELECT id FROM aircraft")
aircraft_ids = [r[0] for r in cur.fetchall()]

cur.execute("SELECT id FROM flights WHERE aircraft_id IS NULL LIMIT 100000")
flight_ids = [r[0] for r in cur.fetchall()]

print(f"  Assigning aircraft to {len(flight_ids)} flights...")
for fid in flight_ids:
    aid = random.choice(aircraft_ids)
    cur.execute("UPDATE flights SET aircraft_id = %s WHERE id = %s", (aid, fid))

print(f"  Done assigning aircraft")


# ─────────────────────────────────────────────
# 2. FLIGHT EVENTS
# ─────────────────────────────────────────────
print("Seeding flight_events...")

cur.execute("""
    SELECT f.id, f.scheduled_dep, f.status
    FROM flights f
    ORDER BY RANDOM()
    LIMIT 500
""")
sample_flights = cur.fetchall()

event_rows = []
now = datetime.now(timezone.utc)

for fid, sched_dep, status in sample_flights:
    dep_time = sched_dep if sched_dep else now

    # Every flight gets a STATUS_CHANGE at scheduled dep time
    event_rows.append((
        str(uuid.uuid4()), fid, "STATUS_CHANGE",
        dep_time,
        '{"from": "SCHEDULED", "to": "BOARDING"}'
    ))

    # Delayed flights get a DELAY_LOGGED event
    if status in ("DELAYED", "CANCELLED"):
        delay_min = random.randint(15, 180)
        event_rows.append((
            str(uuid.uuid4()), fid, "DELAY_LOGGED",
            dep_time - timedelta(minutes=random.randint(10, 60)),
            f'{{"delay_minutes": {delay_min}, "reason": "{random.choice(["Weather", "Air Traffic Control", "Crew", "Mechanical", "Late Aircraft"])}"}}'
        ))

    # ~30% of flights get a GATE_CHANGE
    if random.random() < 0.3:
        old_gate = f"{random.choice('ABCDE')}{random.randint(1,30)}"
        new_gate = f"{random.choice('ABCDE')}{random.randint(1,30)}"
        event_rows.append((
            str(uuid.uuid4()), fid, "GATE_CHANGE",
            dep_time - timedelta(minutes=random.randint(20, 120)),
            f'{{"old_gate": "{old_gate}", "new_gate": "{new_gate}"}}'
        ))

execute_values(cur,
    "INSERT INTO flight_events (id, flight_id, event_type, occurred_at, metadata) VALUES %s ON CONFLICT DO NOTHING",
    event_rows
)
print(f"  Inserted {len(event_rows)} flight events")


# ─────────────────────────────────────────────
# 3. NOTIFICATION PREFERENCES (one per user)
# ─────────────────────────────────────────────
print("Seeding notification_preferences...")

cur.execute("SELECT id FROM users")
user_ids = [r[0] for r in cur.fetchall()]

pref_rows = []
for uid in user_ids:
    pref_rows.append((
        str(uuid.uuid4()),
        uid,
        True,           # push_enabled
        True,           # email_enabled
        "70",           # delay_threshold_pct
        "22:00",        # quiet_hours_start
        "07:00",        # quiet_hours_end
    ))

execute_values(cur,
    """INSERT INTO notification_preferences
       (id, user_id, push_enabled, email_enabled, delay_threshold_pct, quiet_hours_start, quiet_hours_end)
       VALUES %s ON CONFLICT (user_id) DO NOTHING""",
    pref_rows
)
print(f"  Inserted {len(pref_rows)} notification preferences")


conn.commit()
cur.close()
conn.close()
print("\nDone. All missing tables seeded.")

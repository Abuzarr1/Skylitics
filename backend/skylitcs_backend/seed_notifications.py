"""
Seed notifications for all users based on their saved flights + prediction data.

Logic:
  - For each saved flight (notify=True), look up predictions for flights with
    that callsign.
  - delay_probability >= 0.70 → DELAY_ALERT
  - delay_probability >= 0.50 → AT_RISK
  - If origin airport weather severity >= 0.60 → WEATHER_IMPACT
  - Also seed 1 SYSTEM notification per user (welcome / model update)

Run from backend root:
  python seed_notifications.py
"""

import psycopg2
import psycopg2.extras
import uuid
from datetime import datetime, timezone, timedelta
import random

psycopg2.extras.register_uuid()

DB = dict(
    host="localhost", port=5432,
    dbname="skylytics", user="postgres", password="postgres"
)

def main():
    conn = psycopg2.connect(**DB)
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # All users
    cur.execute("SELECT id, full_name FROM users WHERE is_active = TRUE")
    users = cur.fetchall()
    print(f"Found {len(users)} users")

    now = datetime.now(timezone.utc)
    rows = []
    rng  = random.Random(99)

    for user in users:
        uid = user["id"]

        # ── SYSTEM welcome notification ────────────────────────────────
        rows.append((
            uuid.uuid4(), uid, "SYSTEM",
            "Skylytics Model v1.0 Active",
            "XGBoost delay prediction engine is live. Your watchlist alerts are now powered by real-time inference.",
            None, False,
            now - timedelta(hours=rng.randint(12, 48)),
        ))

        # ── Saved flights for this user ────────────────────────────────
        cur.execute("""
            SELECT callsign FROM saved_flights
            WHERE user_id = %s AND notify = TRUE
        """, (uid,))
        saved = cur.fetchall()

        for sf in saved:
            callsign = sf["callsign"]

            # Look up highest-risk prediction for this callsign
            cur.execute("""
                SELECT
                    p.delay_probability,
                    p.predicted_delay_min,
                    ao.iata   AS origin_iata,
                    ad.iata   AS dest_iata,
                    ws.severity AS weather_sev
                FROM flights f
                JOIN predictions p  ON p.flight_id = f.id
                JOIN airports   ao  ON ao.id = f.origin_id
                JOIN airports   ad  ON ad.id = f.dest_id
                LEFT JOIN LATERAL (
                    SELECT severity FROM weather_snapshots ws
                    WHERE ws.airport_id = f.origin_id
                    ORDER BY ws.observed_at DESC LIMIT 1
                ) ws ON TRUE
                WHERE f.flight_number = %s
                ORDER BY p.delay_probability DESC
                LIMIT 1
            """, (callsign,))
            pred = cur.fetchone()
            if not pred:
                continue

            prob     = float(pred["delay_probability"])
            delay_m  = int(pred["predicted_delay_min"])
            origin   = pred["origin_iata"]
            dest     = pred["dest_iata"]
            wx_sev   = float(pred["weather_sev"] or 0)
            ago      = timedelta(minutes=rng.randint(5, 120))

            if prob >= 0.70:
                rows.append((
                    uuid.uuid4(), uid, "DELAY_ALERT",
                    f"Delay Alert — {callsign}",
                    f"{callsign} ({origin}→{dest}) is predicted to be delayed by ~{delay_m} min. "
                    f"Probability: {round(prob*100)}%. Consider alternative connections.",
                    callsign, False, now - ago,
                ))
            elif prob >= 0.50:
                rows.append((
                    uuid.uuid4(), uid, "AT_RISK",
                    f"At-Risk Flight — {callsign}",
                    f"{callsign} ({origin}→{dest}) has a {round(prob*100)}% chance of delay. "
                    f"Estimated impact: {delay_m} min. Monitoring active.",
                    callsign, False, now - ago,
                ))

            if wx_sev >= 0.60:
                rows.append((
                    uuid.uuid4(), uid, "WEATHER_IMPACT",
                    f"Weather Impact — {origin}",
                    f"Adverse weather at {origin} (severity {round(wx_sev*100)}%) may affect {callsign}. "
                    f"Allow extra buffer time.",
                    callsign, False, now - ago - timedelta(minutes=10),
                ))

    if not rows:
        print("No rows to insert — ensure users have saved flights.")
        cur.close()
        conn.close()
        return

    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO notifications
            (id, user_id, type, title, body, callsign, is_read, created_at)
        VALUES %s
        ON CONFLICT DO NOTHING
        """,
        rows,
        page_size=500,
    )
    conn.commit()
    print(f"Inserted {len(rows)} notifications for {len(users)} users.")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()

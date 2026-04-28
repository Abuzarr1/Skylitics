import asyncio
import time
import random
import sys
import os
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from sqlalchemy import text

# Add app to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import AsyncSessionLocal
from app.modules.notifications.watcher import run_watcher_cycle
from app.modules.users.models import User
from app.modules.notifications.models import Notification, NotificationPreference

async def seed_stress_data(flight_count=1000, user_count=200):
    print(f"[StressTest] Seeding {flight_count} flights and {user_count} user preferences...")
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        
        # Get valid IDs for FKs
        airline_res = await db.execute(text("SELECT id FROM airlines LIMIT 5"))
        airlines = [r[0] for r in airline_res.all()]
        
        airport_res = await db.execute(text("SELECT id FROM airports LIMIT 10"))
        airports = [r[0] for r in airport_res.all()]
        
        aircraft_res = await db.execute(text("SELECT id FROM aircraft LIMIT 10"))
        aircrafts = [r[0] for r in aircraft_res.all()]
        
        if not airlines or not airports or not aircrafts:
            print("[StressTest] ERROR: Database lacks baseline data. Run baseline seeders first.")
            return False

        # Seed Flights
        for i in range(flight_count):
            f_id = uuid4()
            await db.execute(text("""
                INSERT INTO flights (id, flight_number, airline_id, origin_id, dest_id, aircraft_id, scheduled_dep, scheduled_arr, status, data_source)
                VALUES (:id, :num, :al, :orig, :dest, :airc, :sdep, :sarr, 'SCHEDULED', 'STRESS_TEST')
            """), {
                "id": f_id,
                "num": f"STRESS{i}",
                "al": random.choice(airlines),
                "orig": random.choice(airports),
                "dest": random.choice(airports),
                "airc": random.choice(aircrafts),
                "sdep": now + timedelta(minutes=random.randint(5, 230)),
                "sarr": now + timedelta(hours=3),
                "status": "SCHEDULED"
            })

        # Seed Users & Preferences
        for i in range(user_count):
            u_id = uuid4()
            # Create user
            await db.execute(text("""
                INSERT INTO users (id, email, password_hash, full_name, role, created_at)
                VALUES (:id, :email, 'hash', 'Stress User', 'MANAGER', :now)
            """), {"id": u_id, "email": f"stress_user_{i}@skylytics.test", "now": now})
            
            # Create preference
            await db.execute(text("""
                INSERT INTO notification_preferences (id, user_id, email_enabled, push_enabled, delay_threshold_pct, quiet_hours_start, quiet_hours_end)
                VALUES (:id, :uid, true, true, :threshold, '23:00', '07:00')
            """), {
                "id": uuid4(),
                "uid": u_id,
                "threshold": str(random.randint(10, 80))
            })

        await db.commit()
    print("[StressTest] Seeding completed.")
    return True

async def cleanup_stress_data():
    print("[StressTest] Cleaning up stress data...")
    async with AsyncSessionLocal() as db:
        await db.execute(text("DELETE FROM notifications WHERE callsign LIKE 'STRESS%'"))
        await db.execute(text("DELETE FROM notification_preferences WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'stress_user_%')"))
        await db.execute(text("DELETE FROM users WHERE email LIKE 'stress_user_%'"))
        await db.execute(text("DELETE FROM flights WHERE data_source = 'STRESS_TEST'"))
        await db.commit()
    print("[StressTest] Cleanup completed.")

async def run_stress_test():
    # 1. Setup
    if not await seed_stress_data(flight_count=500, user_count=100):
        return

    try:
        # 2. Execute & Time
        print("\n" + "="*50)
        print("SKYLYTICS PULSE WATCHER STRESS TEST")
        print("="*50)
        
        start_time = time.perf_counter()
        
        # Trigger the watcher cycle
        await run_watcher_cycle()
        
        end_time = time.perf_counter()
        total_time = end_time - start_time
        
        print(f"\n[Result] Total Cycle Time: {total_time:.4f} seconds")
        print(f"[Result] Avg Time per Flight Prediction: {total_time/500:.6f}s")
        print("="*50 + "\n")
        
        # 3. Check Results in DB
        async with AsyncSessionLocal() as db:
            count = await db.execute(text("SELECT count(*) FROM notifications WHERE callsign LIKE 'STRESS%'"))
            notif_count = count.scalar()
            print(f"[Verify] Sent {notif_count} AI delay advisories during this cycle.")

    finally:
        # 4. Cleanup
        await cleanup_stress_data()

if __name__ == "__main__":
    asyncio.run(run_stress_test())

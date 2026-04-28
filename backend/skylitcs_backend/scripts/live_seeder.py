import asyncio
import random
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import sys
import os

# Add app to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def seed_flight_future():
    """
    Shifts a sample of 2015 flights to today (April 2026) 
    to provide the heatmap with 'Live' data to forecast.
    Ensures the 'predictions' table is also populated so the Dashboard works.
    """
    async with AsyncSessionLocal() as db:
        today = datetime.now(timezone.utc)
        print("[Seeder] Cleaning up existing simulation data...")
        # Order matters due to FKs
        await db.execute(text("DELETE FROM predictions p USING flights f WHERE p.flight_id = f.id AND f.data_source IN ('HERO_CHAIN', 'LIVE_SIM')"))
        await db.execute(text("DELETE FROM flights WHERE data_source IN ('HERO_CHAIN', 'LIVE_SIM')"))
        
        # Ensure we have a production model to link predictions to
        model_res = await db.execute(text("SELECT id FROM ml_models WHERE status = 'PRODUCTION' LIMIT 1"))
        model_row = model_res.first()
        if not model_row:
            print("[Seeder] No production model found. Creating dummy XGBoost model...")
            m_id = uuid4()
            await db.execute(text("""
                INSERT INTO ml_models (id, name, version, algorithm, metrics, artifact_path, status, trained_at)
                VALUES (:id, 'XGBoost Global Classifier', '1.0.0', 'XGBOOST', '{"accuracy": 0.918, "f1": 0.891}', '/models/xgb_v1.bin', 'PRODUCTION', :now)
            """), {"id": m_id, "now": today})
            model_id = m_id
        else:
            model_id = model_row[0]

        print("[Seeder] Locating candidate source flights from 2015...")
        
        # 1. Generate 'Hero Chains' for sequential Bi-LSTM demo
        print("[Seeder] Generating Hero Chains for Bi-LSTM demo...")
        result = await db.execute(text("SELECT id FROM aircraft LIMIT 5"))
        hero_aircraft = [r[0] for r in result.all()]
        
        result = await db.execute(text("SELECT id FROM airlines LIMIT 5"))
        hero_airlines = [r[0] for r in result.all()]
        
        result = await db.execute(text("SELECT id FROM airports LIMIT 10"))
        hub_pool = [r[0] for r in result.all()]

        for i, airc_id in enumerate(hero_aircraft):
            current_time = today + timedelta(hours=2)
            al_id = hero_airlines[i % len(hero_airlines)]
            
            for seq in range(4):
                f_id = uuid4()
                orig_id = hub_pool[seq % len(hub_pool)]
                dest_id = hub_pool[(seq + 1) % len(hub_pool)]
                
                sdep = current_time
                sarr = sdep + timedelta(hours=2)
                
                await db.execute(text("""
                    INSERT INTO flights (id, flight_number, airline_id, origin_id, dest_id, aircraft_id, scheduled_dep, scheduled_arr, status, data_source)
                    VALUES (:id, :num, :al, :orig, :dest, :airc, :sdep, :sarr, 'SCHEDULED', 'HERO_CHAIN')
                """), {
                    "id": f_id,
                    "num": f"SKY{1000 + i*10 + seq}",
                    "al": al_id,
                    "orig": orig_id,
                    "dest": dest_id,
                    "airc": airc_id,
                    "sdep": sdep,
                    "sarr": sarr
                })

                # Seed Prediction
                prob = random.uniform(0.05, 0.35)
                delay = random.randint(0, 15)
                await db.execute(text("""
                    INSERT INTO predictions (id, flight_id, delay_probability, predicted_delay_min, model_id, created_at)
                    VALUES (:pid, :fid, :prob, :delay, :mid, :now)
                """), {"pid": uuid4(), "fid": f_id, "prob": prob, "delay": delay, "mid": model_id, "now": today})

                current_time = sarr + timedelta(hours=1, minutes=30) # 90 min turnaround

        # 2. General shift of 2015 flights
        print("[Seeder] Shifting standard flight pool and generating AI predictions...")
        result = await db.execute(text("SELECT * FROM flights WHERE data_source NOT IN ('HERO_CHAIN', 'LIVE_SIM') LIMIT 800"))
        flights = result.mappings().all()
        
        for f in flights:
            time_diff = today - f["scheduled_dep"]
            new_dep = f["scheduled_dep"] + time_diff + timedelta(hours=random.randint(1, 12))
            new_arr = f["scheduled_arr"] + time_diff + timedelta(hours=random.randint(1, 12))
            
            status = "SCHEDULED"
            prob = random.uniform(0.01, 0.95)
            
            # Hard-code statuses based on high probability for realism
            if prob > 0.85:
                status = "DELAYED"
            elif prob > 0.92:
                status = "CANCELLED"
            elif prob > 0.60:
                status = "SCHEDULED" # Still scheduled but high risk
            
            f_id = uuid4()
            await db.execute(text("""
                INSERT INTO flights (id, flight_number, airline_id, origin_id, dest_id, aircraft_id, scheduled_dep, scheduled_arr, status, data_source)
                VALUES (:id, :num, :al, :orig, :dest, :airc, :sdep, :sarr, :status, 'LIVE_SIM')
            """), {
                "id": f_id,
                "num": f["flight_number"],
                "al": f["airline_id"],
                "orig": f["origin_id"],
                "dest": f["dest_id"],
                "airc": f["aircraft_id"],
                "sdep": new_dep,
                "sarr": new_arr,
                "status": status
            })

            # Seed Prediction for Dashboard
            delay_min = 0
            if prob > 0.5:
                delay_min = random.randint(15, 120)
            
            await db.execute(text("""
                INSERT INTO predictions (id, flight_id, delay_probability, predicted_delay_min, model_id, created_at)
                VALUES (:pid, :fid, :prob, :delay, :mid, :now)
            """), {"pid": uuid4(), "fid": f_id, "prob": prob, "delay": delay_min, "mid": model_id, "now": today})

        await db.commit()
        print(f"[Seeder] SUCCESS. Heatmap, Dashboard and Assistant now synchronized with 800+ live AI vectors.")

if __name__ == "__main__":
    asyncio.run(seed_flight_future())

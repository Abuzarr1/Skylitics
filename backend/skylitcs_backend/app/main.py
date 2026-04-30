from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # CORS — explicit origins + regex for Vercel preview deployments
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://skylitics-m51s.vercel.app",
        ],
        allow_origin_regex=r"https://skylitics-m51s.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["system"])
    async def health_check(seed: bool = False, db: AsyncSession = Depends(get_db)):
        from app.db.session import AsyncSessionLocal
        from sqlalchemy import text
        
        seed_msg = "No seed requested"
        if seed:
            try:
                # 1. Create Airports
                await db.execute(text("""
                    INSERT INTO airports (id, iata, icao, name, city, country, latitude, longitude, timezone)
                    VALUES 
                        (gen_random_uuid(), 'ATL', 'KATL', 'Hartsfield-Jackson Atlanta', 'Atlanta', 'USA', 33.64, -84.43, 'America/New_York'),
                        (gen_random_uuid(), 'JFK', 'KJFK', 'John F. Kennedy', 'New York', 'USA', 40.64, -73.78, 'America/New_York'),
                        (gen_random_uuid(), 'LAX', 'KLAX', 'Los Angeles Intl', 'Los Angeles', 'USA', 33.94, -118.41, 'America/Los_Angeles'),
                        (gen_random_uuid(), 'DEN', 'KDEN', 'Denver Intl', 'Denver', 'USA', 39.86, -104.67, 'America/Denver'),
                        (gen_random_uuid(), 'ORD', 'KORD', 'OHare Intl', 'Chicago', 'USA', 41.98, -87.91, 'America/Chicago'),
                        (gen_random_uuid(), 'DFW', 'KDFW', 'Dallas/Fort Worth', 'Dallas', 'USA', 32.90, -97.04, 'America/Chicago'),
                        (gen_random_uuid(), 'MIA', 'KMIA', 'Miami Intl', 'Miami', 'USA', 25.79, -80.29, 'America/New_York'),
                        (gen_random_uuid(), 'SFO', 'KSFO', 'San Francisco Intl', 'San Francisco', 'USA', 37.62, -122.37, 'America/Los_Angeles'),
                        (gen_random_uuid(), 'SEA', 'KSEA', 'Seattle-Tacoma', 'Seattle', 'USA', 47.45, -122.31, 'America/Los_Angeles')
                    ON CONFLICT (iata) DO NOTHING
                """))
                
                # 2. Create Airlines
                await db.execute(text("""
                    INSERT INTO airlines (id, iata, name, country)
                    VALUES 
                        (gen_random_uuid(), 'DL', 'Delta Air Lines', 'USA'),
                        (gen_random_uuid(), 'AA', 'American Airlines', 'USA'),
                        (gen_random_uuid(), 'UA', 'United Airlines', 'USA'),
                        (gen_random_uuid(), 'WN', 'Southwest Airlines', 'USA'),
                        (gen_random_uuid(), 'AS', 'Alaska Airlines', 'USA'),
                        (gen_random_uuid(), 'B6', 'JetBlue Airways', 'USA')
                    ON CONFLICT (iata) DO NOTHING
                """))
                
                # 3. Seed ML model registry
                await db.execute(text("""
                    INSERT INTO ml_models (id, name, version, algorithm, metrics, status)
                    VALUES 
                        ('xgb-cls-1.0', 'XGBoost Classifier', 'v1.0.0', 'XGBOOST', '{"accuracy": 0.918, "f1": 0.891}', 'PRODUCTION'),
                        ('xgb-reg-1.0', 'XGBoost Regressor', 'v1.0.0', 'XGBOOST', '{"rmse": 14.2}', 'PRODUCTION')
                    ON CONFLICT DO NOTHING
                """))

                # 4. Create Flights
                await db.execute(text("""
                    INSERT INTO flights (id, flight_number, airline_id, origin_id, dest_id, scheduled_dep, status, gate, terminal)
                    SELECT 
                        gen_random_uuid(),
                        al.iata || (100 + i + (row_number() OVER ())),
                        al.id,
                        ao.id,
                        (SELECT id FROM airports WHERE iata != ao.iata LIMIT 1),
                        (CURRENT_DATE + ((6 + (i % 15)) || ' hours')::interval),
                        'SCHEDULED',
                        'G' || i,
                        'T'
                    FROM airports ao
                    CROSS JOIN airlines al
                    CROSS JOIN generate_series(1, 10) AS i
                    WHERE al.iata IN ('DL', 'AA', 'UA')
                    ON CONFLICT DO NOTHING
                """))

                # 5. Create Predictions
                await db.execute(text("""
                    INSERT INTO predictions (id, flight_id, model_id, delay_probability, predicted_delay_min, confidence_lower, confidence_upper, status)
                    SELECT 
                        gen_random_uuid(),
                        f.id,
                        'xgb-cls-1.0',
                        (0.1 + (random() * 0.8)),
                        (random() * 60)::int,
                        5,
                        120,
                        'COMPLETED'
                    FROM flights f
                    WHERE f.scheduled_dep >= CURRENT_DATE
                    ON CONFLICT DO NOTHING
                """))
                
                await db.commit()
                seed_msg = "Seeding successful"
            except Exception as e:
                seed_msg = f"Seeding failed: {e}"

        db_status = "unknown"
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
                db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"

        user_table = "unknown"
        if "connected" in db_status:
            try:
                async with AsyncSessionLocal() as session:
                    await session.execute(text("SELECT 1 FROM users LIMIT 1"))
                    user_table = "ok"
            except Exception as e:
                user_table = f"error: {str(e)}"

        return {
            "status": "online",
            "database": db_status,
            "user_table": user_table,
            "seed_status": seed_msg,
            "message": "Skylytics Backend is operational"
        }

    # Import and register module routers
    from app.modules.auth.router import router as auth_router
    from app.modules.flights.router import router as flights_router
    from app.modules.predictions.router import router as predictions_router
    from app.modules.assistant.router import router as assistant_router
    from app.modules.system.router import router as system_router
    from app.modules.ops.router import router as ops_router
    from app.modules.saved.router import router as saved_router
    from app.modules.notifications.router import router as notifications_router
    from app.modules.weather.router import router as weather_router
    from app.modules.whatif.router import router as whatif_router

    app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
    app.include_router(flights_router, prefix=f"{settings.API_V1_STR}/flights", tags=["flights"])
    app.include_router(predictions_router, prefix=f"{settings.API_V1_STR}/predictions", tags=["predictions"])
    app.include_router(assistant_router, prefix=f"{settings.API_V1_STR}/assistant", tags=["assistant"])
    app.include_router(system_router, prefix=f"{settings.API_V1_STR}/system", tags=["system"])
    app.include_router(ops_router, prefix=f"{settings.API_V1_STR}/ops", tags=["ops"])
    app.include_router(saved_router, prefix=f"{settings.API_V1_STR}/saved", tags=["saved"])
    app.include_router(notifications_router, prefix=f"{settings.API_V1_STR}/notifications", tags=["notifications"])
    app.include_router(weather_router, prefix=f"{settings.API_V1_STR}/weather", tags=["weather"])
    app.include_router(whatif_router, prefix=f"{settings.API_V1_STR}/whatif", tags=["whatif"])

    setup_exception_handlers(app)

    @app.on_event("startup")
    async def on_startup():
        # Background loop for notification checks
        from app.modules.notifications.watcher import start_watcher_loop
        import asyncio
        asyncio.create_task(start_watcher_loop(interval_minutes=5))

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

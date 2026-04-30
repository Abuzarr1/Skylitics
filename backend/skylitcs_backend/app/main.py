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
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://skylitics-m51s.vercel.app",
        ],
        allow_origin_regex=r"https://skylitics-m51s.*\.vercel\.app", # Matches all preview/branch URLs
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/seed-data")
    async def seed_data(db: AsyncSession = Depends(get_db)):
        from sqlalchemy import text
        try:
            # 1. Create Airports (ATL, JFK, LAX)
            await db.execute(text("""
                INSERT INTO airports (id, iata, name, city, country, latitude, longitude)
                VALUES 
                    (gen_random_uuid(), 'ATL', 'Hartsfield-Jackson Atlanta', 'Atlanta', 'USA', 33.64, -84.43),
                    (gen_random_uuid(), 'JFK', 'John F. Kennedy', 'New York', 'USA', 40.64, -73.78),
                    (gen_random_uuid(), 'LAX', 'Los Angeles Intl', 'Los Angeles', 'USA', 33.94, -118.41)
                ON CONFLICT (iata) DO NOTHING
            """))
            
            # 2. Create Airlines (DL, AA, UA)
            await db.execute(text("""
                INSERT INTO airlines (id, iata, name, country)
                VALUES 
                    (gen_random_uuid(), 'DL', 'Delta Air Lines', 'USA'),
                    (gen_random_uuid(), 'AA', 'American Airlines', 'USA'),
                    (gen_random_uuid(), 'UA', 'United Airlines', 'USA')
                ON CONFLICT (iata) DO NOTHING
            """))
            
            # 3. Create Flights for TODAY
            await db.execute(text("""
                INSERT INTO flights (id, flight_number, airline_id, origin_id, dest_id, scheduled_dep, status, gate, terminal)
                SELECT 
                    gen_random_uuid(),
                    'DL' || (100 + i),
                    (SELECT id FROM airlines WHERE iata = 'DL'),
                    (SELECT id FROM airports WHERE iata = 'ATL'),
                    (SELECT id FROM airports WHERE iata = 'JFK'),
                    (CURRENT_DATE + (i || ' hours')::interval),
                    'SCHEDULED',
                    'A' || i,
                    'T'
                FROM generate_series(1, 10) AS i
                ON CONFLICT DO NOTHING
            """))
            
            await db.commit()
            return {"status": "ok", "message": "Production data seeded successfully"}
        except Exception as e:
            await db.rollback()
            return {"status": "error", "detail": str(e)}

    @app.get("/debug-register")
    async def debug_register(db: AsyncSession = Depends(get_db)):
        from app.modules.users.models import User, UserRole
        from app.core.security import get_password_hash
        try:
            u = User(
                email=f"debug_{int(datetime.utcnow().timestamp())}@test.com",
                password_hash=get_password_hash("pass"),
                full_name="Debug User",
                role=UserRole.ADMIN
            )
            db.add(u)
            await db.commit()
            return {"status": "ok", "user_id": str(u.id)}
        except Exception as e:
            return {"status": "error", "detail": str(e)}

    @app.get("/health", tags=["system"])
    async def health_check():
        from app.db.session import AsyncSessionLocal
        from sqlalchemy import text
        from app.modules.users.models import User
        from sqlalchemy.future import select
        
        db_status = "unknown"
        db_error = None
        user_table = "unknown"
        
        try:
            async with AsyncSessionLocal() as db:
                await db.execute(text("SELECT 1"))
                db_status = "connected"
                
                try:
                    # Check if users table exists and has all columns
                    await db.execute(select(User).limit(1))
                    user_table = "ok"
                except Exception as ue:
                    user_table = f"error: {str(ue)}"
        except Exception as e:
            db_status = "error"
            db_error = str(e)

        return {
            "status": "online",
            "database": db_status,
            "database_error": db_error,
            "user_table": user_table,
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

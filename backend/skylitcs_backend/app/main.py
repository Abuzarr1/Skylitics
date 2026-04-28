from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )

    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.get("/health", tags=["system"])
    async def health_check():
        return {
            "status": "online",
            "message": "Skylytics Backend is operational (Modular Monolith)"
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
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

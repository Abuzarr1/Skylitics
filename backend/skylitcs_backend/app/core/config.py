from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Dict, Any

class Settings(BaseSettings):
    PROJECT_NAME: str = "Skylytics API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://skylitics-m51s.vercel.app",
        "https://skylitics-m51s-etnmxbbtd-abuzars-projects-59bb7991.vercel.app",
    ]
    
    # DB
    DATABASE_URL: str = ""
    POSTGRES_SERVER: str = "127.0.0.1"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "skylytics"
    POSTGRES_PORT: int = 5432
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            # Handle Render/Heroku style URLs
            uri = self.DATABASE_URL.strip()
            if uri.startswith("postgres://"):
                uri = uri.replace("postgres://", "postgresql+asyncpg://", 1)
            elif uri.startswith("postgresql://"):
                uri = uri.replace("postgresql://", "postgresql+asyncpg://", 1)
            return uri
        # Construct async PostgreSQL URI from components (local dev)
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def DB_CONNECT_ARGS(self) -> Dict[str, Any]:
        # Render's PostgreSQL requires SSL with a self-signed cert.
        # asyncpg needs SSL passed explicitly, and cert verification must be
        # disabled because Render uses self-signed certificates.
        if self.DATABASE_URL:
            import ssl
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            return {"ssl": ctx}
        return {}
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Auth
    SECRET_KEY: str = "a_very_secret_key_for_development_only_change_me_in_prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    # AI
    GEMINI_API_KEY: str = ""
    
    # Security Keys
    MANAGER_ACCESS_KEY: str = "SKY-2026-MGR" # Default key for manager registration
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""
    
    # Project info
    PROJECT_NAME: str = "Crypto Signals API"
    API_VERSION: str = "1.0.0"
    
    # Environment
    ENV: str = "development"
    
    # API Configuration
    API_BASE_URL: str = ""
    
    # CORS - configurable via environment variable for production
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

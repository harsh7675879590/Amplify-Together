from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Amplify Together"
    API_V1_PREFIX: str = "/api"
    SECRET_KEY: str = "amplify-together-hackathon-super-secret-key-2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "sqlite:///./amplify.db"

    # Business Model Demo Assumptions
    PLATFORM_FEE_PCT: float = 0.05  # 5% platform fee
    PROCESSING_FEE_PCT: float = 0.029  # 2.9% stripe-like fee
    PROCESSING_FEE_FIXED: float = 0.30  # $0.30 fixed fee per tx

    # Reach Estimation Engine Demo Assumptions
    # Based on benchmark: $1 delivers message to ~120 targeted people outside creator feed
    REACH_PER_DOLLAR: int = 120
    REACH_LOW_FACTOR: float = 0.70
    REACH_HIGH_FACTOR: float = 1.30

    # CORS origins
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        case_sensitive = True


settings = Settings()

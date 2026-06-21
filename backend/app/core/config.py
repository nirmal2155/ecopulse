"""Application configuration loaded from .env file."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""          # Leave blank → mock mode
    APP_ENV: str = "development"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

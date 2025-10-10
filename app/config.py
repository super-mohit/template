# File: app/config.py
import os

from dotenv import load_dotenv
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=False)

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")


settings = Settings()

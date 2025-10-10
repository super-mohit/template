# File: app/config.py
import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=False)
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()


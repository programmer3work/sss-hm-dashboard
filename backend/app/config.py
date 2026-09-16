import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT")

AI_TTS_URL = os.getenv("AI_TTS_URL")
AI_TTS_API_KEY = os.getenv("AI_TTS_API_KEY")
AI_TTS_TIMEOUT_SECONDS = float(os.getenv("AI_TTS_TIMEOUT_SECONDS", "30"))

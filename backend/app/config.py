from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    # Database: Default to SQLite for zero-friction local run; set DATABASE_URL for Postgres/Supabase/Neon
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./smartflow.db")
    
    # LLM Settings: "auto", "groq", "gemini", "openai", "local" (Ollama), or "fallback"
    llm_provider: str = os.getenv("LLM_PROVIDER", "auto")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    
    # Ollama settings (for local private AI)
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    
    # CORS allowed origins (comma separated or *)
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,*")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()


from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    
    port: int = 8000
    environment: str = "development"

   
    ollama_url: str = "http://ollama:11434"
    ollama_model: str = "mistral"

   
    embedding_model_name: str = "all-MiniLM-L6-v2"

    internal_api_key: str 
    whisper_model_size: str = "small"


settings = Settings()
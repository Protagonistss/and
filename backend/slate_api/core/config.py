from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Slate Backend"
    app_env: str = "development"
    api_prefix: str = "/api/v1"

    secret_key: str = "replace-with-a-long-random-secret-key-32-bytes-min"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/slate"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: str = "http://localhost:1420,http://localhost:5173"

    frontend_oauth_success_url: str | None = None
    frontend_oauth_failure_url: str | None = None

    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = "http://localhost:8000/api/v1/auth/oauth/github/callback"

    gitee_client_id: str = ""
    gitee_client_secret: str = ""
    gitee_redirect_uri: str = "http://localhost:8000/api/v1/auth/oauth/gitee/callback"

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/oauth/google/callback"

    llm_default_provider: str = "deepseek"
    llm_request_timeout_seconds: int = 120

    llm_deepseek_api_key: str = ""
    llm_deepseek_base_url: str = "https://api.deepseek.com/v1"
    llm_deepseek_models: str = "deepseek-chat,deepseek-reasoner"

    llm_qwen_api_key: str = ""
    llm_qwen_base_url: str = ""
    llm_qwen_models: str = "qwen-plus,qwen-max"

    llm_zhipu_api_key: str = ""
    llm_zhipu_base_url: str = ""
    llm_zhipu_models: str = "glm-4-plus,glm-4-air"

    llm_doubao_api_key: str = ""
    llm_doubao_base_url: str = ""
    llm_doubao_models: str = "doubao-1-5-pro-32k,doubao-1-5-lite-32k"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @staticmethod
    def _split_csv(raw: str) -> list[str]:
        return [item.strip() for item in raw.split(",") if item.strip()]

    @property
    def llm_provider_specs(self) -> dict[str, dict[str, object]]:
        return {
            "deepseek": {
                "display_name": "DeepSeek",
                "api_key": self.llm_deepseek_api_key,
                "base_url": self.llm_deepseek_base_url,
                "models": self._split_csv(self.llm_deepseek_models),
            },
            "qwen": {
                "display_name": "Qwen",
                "api_key": self.llm_qwen_api_key,
                "base_url": self.llm_qwen_base_url,
                "models": self._split_csv(self.llm_qwen_models),
            },
            "zhipu": {
                "display_name": "Zhipu",
                "api_key": self.llm_zhipu_api_key,
                "base_url": self.llm_zhipu_base_url,
                "models": self._split_csv(self.llm_zhipu_models),
            },
            "doubao": {
                "display_name": "Doubao",
                "api_key": self.llm_doubao_api_key,
                "base_url": self.llm_doubao_base_url,
                "models": self._split_csv(self.llm_doubao_models),
            },
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

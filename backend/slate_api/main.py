from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from slate_api.core.config import settings
from slate_api.infra.database import engine, redis_client
from slate_api.modules.auth.router import router as auth_router
from slate_api.modules.conversations.router import router as conversations_router
from slate_api.modules.llm.router import router as llm_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz")
    def healthz() -> dict[str, str]:
        database_status = "ok"
        redis_status = "ok"

        try:
            with engine.connect() as connection:
                connection.execute(text("select 1"))
        except Exception:
            database_status = "error"

        try:
            redis_client.ping()
        except Exception:
            redis_status = "error"

        status_value = "ok" if database_status == "ok" and redis_status == "ok" else "degraded"
        return {"status": status_value, "database": database_status, "redis": redis_status}

    app.include_router(auth_router, prefix=settings.api_prefix)
    app.include_router(conversations_router, prefix=settings.api_prefix)
    app.include_router(llm_router, prefix=settings.api_prefix)

    return app


app = create_app()

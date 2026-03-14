from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from slate_api.core.deps import get_current_user
from slate_api.infra.database import get_db
from slate_api.infra.models import User
from slate_api.modules.llm.schemas import LLMChatRequest, LLMModelRead, LLMProviderRead
from slate_api.modules.llm.service import (
    LLMGatewayError,
    get_model_catalog,
    get_provider_catalog,
    resolve_provider,
    stream_chat_completion,
)

router = APIRouter(tags=["llm"])


@router.get("/llm/providers", response_model=list[LLMProviderRead])
def list_providers(current_user: User = Depends(get_current_user)) -> list[LLMProviderRead]:
    del current_user
    return get_provider_catalog()


@router.get("/llm/models", response_model=list[LLMModelRead])
def list_models(current_user: User = Depends(get_current_user)) -> list[LLMModelRead]:
    del current_user
    return get_model_catalog()


@router.post("/llm/chat/stream")
async def chat_stream(
    payload: LLMChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        resolve_provider(payload.provider, payload.model)
    except LLMGatewayError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return StreamingResponse(
        stream_chat_completion(db, current_user, payload),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

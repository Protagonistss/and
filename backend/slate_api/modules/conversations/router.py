from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from slate_api.core.deps import get_current_user
from slate_api.infra.database import get_db
from slate_api.infra.models import User
from slate_api.modules.conversations.schemas import (
    ConversationCreateRequest,
    ConversationMessageCreate,
    ConversationMessageRead,
    ConversationRead,
    ConversationSummary,
)
from slate_api.modules.conversations.service import (
    append_conversation_message,
    create_user_conversation,
    get_user_conversation,
    list_conversation_messages,
    list_user_conversations,
)

router = APIRouter(tags=["conversations"])


@router.get("/conversations", response_model=list[ConversationSummary])
def list_conversations(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ConversationSummary]:
    return list_user_conversations(db, current_user, limit=limit, offset=offset)


@router.post("/conversations", response_model=ConversationRead)
def create_conversation(
    payload: ConversationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConversationRead:
    return create_user_conversation(db, current_user, payload)


@router.get("/conversations/{conversation_id}", response_model=ConversationRead)
def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConversationRead:
    return get_user_conversation(db, current_user, conversation_id)


@router.get("/conversations/{conversation_id}/messages", response_model=list[ConversationMessageRead])
def list_messages(
    conversation_id: UUID,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ConversationMessageRead]:
    return list_conversation_messages(
        db,
        current_user,
        conversation_id,
        limit=limit,
        offset=offset,
    )


@router.post("/conversations/{conversation_id}/messages", response_model=ConversationMessageRead)
def append_message(
    conversation_id: UUID,
    payload: ConversationMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConversationMessageRead:
    return append_conversation_message(db, current_user, conversation_id, payload)

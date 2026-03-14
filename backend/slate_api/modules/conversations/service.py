from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from slate_api.infra.database import utcnow
from slate_api.infra.models import Conversation, ConversationMessage, User
from slate_api.modules.conversations.schemas import (
    ConversationCreateRequest,
    ConversationMessageCreate,
    ConversationMessageRead,
    ConversationRead,
    ConversationSummary,
)


def _get_conversation_or_404(db: Session, user_id: UUID, conversation_id: UUID) -> Conversation:
    conversation = db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
    ).scalar_one_or_none()
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="会话不存在")
    return conversation


def _preview_content(content: str | list[dict[str, Any]]) -> str:
    if isinstance(content, str):
        return content[:80]

    text_parts: list[str] = []
    for block in content:
        if block.get("type") == "text":
            text_parts.append(str(block.get("text", "")))
        elif block.get("type") == "tool_use":
            text_parts.append(str(block.get("name", "")))
        elif block.get("type") == "tool_result":
            text_parts.append(str(block.get("content", "")))
    return " ".join(part for part in text_parts if part).strip()[:80]


def _serialize_message(message: ConversationMessage) -> ConversationMessageRead:
    content: str | list[dict[str, object]] = message.content_blocks or message.content_text or ""
    return ConversationMessageRead(
        id=message.id,
        role=message.role,  # type: ignore[arg-type]
        content=content,
        created_at=message.created_at,
    )


def list_user_conversations(
    db: Session,
    current_user: User,
    *,
    limit: int,
    offset: int,
) -> list[ConversationSummary]:
    conversations = (
        db.execute(
            select(Conversation)
            .where(Conversation.user_id == current_user.id)
            .order_by(Conversation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        .scalars()
        .all()
    )

    items: list[ConversationSummary] = []
    for conversation in conversations:
        last_message = (
            db.execute(
                select(ConversationMessage)
                .where(ConversationMessage.conversation_id == conversation.id)
                .order_by(ConversationMessage.created_at.desc())
                .limit(1)
            )
            .scalar_one_or_none()
        )
        preview = ""
        if last_message is not None:
            preview = _preview_content(last_message.content_blocks or last_message.content_text or "")

        items.append(
            ConversationSummary(
                id=conversation.id,
                title=conversation.title,
                workspace_id=conversation.workspace_id,
                created_at=conversation.created_at,
                updated_at=conversation.updated_at,
                last_message_preview=preview or None,
            )
        )

    return items


def create_user_conversation(
    db: Session,
    current_user: User,
    payload: ConversationCreateRequest,
) -> ConversationRead:
    conversation = Conversation(
        user_id=current_user.id,
        title=payload.title or "New Conversation",
        workspace_id=payload.workspace_id,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return ConversationRead(
        id=conversation.id,
        title=conversation.title,
        workspace_id=conversation.workspace_id,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


def get_user_conversation(
    db: Session,
    current_user: User,
    conversation_id: UUID,
) -> ConversationRead:
    conversation = _get_conversation_or_404(db, current_user.id, conversation_id)
    return ConversationRead(
        id=conversation.id,
        title=conversation.title,
        workspace_id=conversation.workspace_id,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


def list_conversation_messages(
    db: Session,
    current_user: User,
    conversation_id: UUID,
    *,
    limit: int,
    offset: int,
) -> list[ConversationMessageRead]:
    _get_conversation_or_404(db, current_user.id, conversation_id)
    messages = (
        db.execute(
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conversation_id)
            .order_by(ConversationMessage.created_at.asc())
            .offset(offset)
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return [_serialize_message(message) for message in messages]


def append_conversation_message(
    db: Session,
    current_user: User,
    conversation_id: UUID,
    payload: ConversationMessageCreate,
) -> ConversationMessageRead:
    conversation = _get_conversation_or_404(db, current_user.id, conversation_id)

    message = ConversationMessage(
        conversation_id=conversation.id,
        role=payload.role,
        content_text=payload.content if isinstance(payload.content, str) else None,
        content_blocks=[block.model_dump() for block in payload.content] if isinstance(payload.content, list) else None,
    )
    db.add(message)

    if conversation.title == "New Conversation" and payload.role == "user":
        conversation.title = _preview_content(
            payload.content if isinstance(payload.content, str) else [block.model_dump() for block in payload.content]
        ) or conversation.title

    conversation.updated_at = utcnow()
    db.add(conversation)
    db.commit()
    db.refresh(message)

    return _serialize_message(message)

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from slate_api.core.schemas import ContentBlock


class ConversationCreateRequest(BaseModel):
    title: str | None = None
    workspace_id: str | None = None


class ConversationSummary(BaseModel):
    id: UUID
    title: str
    workspace_id: str | None = None
    created_at: datetime
    updated_at: datetime
    last_message_preview: str | None = None


class ConversationRead(BaseModel):
    id: UUID
    title: str
    workspace_id: str | None = None
    created_at: datetime
    updated_at: datetime


class ConversationMessageCreate(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str | list[ContentBlock]


class ConversationMessageRead(BaseModel):
    id: UUID
    role: Literal["system", "user", "assistant"]
    content: str | list[dict[str, object]]
    created_at: datetime

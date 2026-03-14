from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field


class TextContentBlock(BaseModel):
    type: Literal["text"]
    text: str


class ImageSource(BaseModel):
    type: Literal["base64", "url"]
    media_type: str
    data: str


class ImageContentBlock(BaseModel):
    type: Literal["image"]
    source: ImageSource


class ToolUseContentBlock(BaseModel):
    type: Literal["tool_use"]
    id: str
    name: str
    input: dict[str, Any]


class ToolResultContentBlock(BaseModel):
    type: Literal["tool_result"]
    tool_use_id: str
    content: str
    is_error: bool | None = None


ContentBlock = Annotated[
    TextContentBlock | ImageContentBlock | ToolUseContentBlock | ToolResultContentBlock,
    Field(discriminator="type"),
]


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str | list[ContentBlock]


class ToolDefinition(BaseModel):
    name: str
    description: str
    input_schema: dict[str, Any]

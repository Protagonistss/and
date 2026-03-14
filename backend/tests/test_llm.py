from __future__ import annotations

import pytest


def _load_llm_dependencies():
    pytest.importorskip("httpx")
    pytest.importorskip("pydantic_settings")
    pytest.importorskip("sqlalchemy")

    from slate_api.core.schemas import (
        ChatMessage,
        ImageContentBlock,
        ImageSource,
        TextContentBlock,
        ToolResultContentBlock,
        ToolUseContentBlock,
    )
    from slate_api.modules.llm import service as llm

    return llm, ChatMessage, ImageContentBlock, ImageSource, TextContentBlock, ToolResultContentBlock, ToolUseContentBlock


def test_format_messages_for_openai_supports_tool_use_blocks() -> None:
    (
        llm,
        ChatMessage,
        _ImageContentBlock,
        _ImageSource,
        TextContentBlock,
        _ToolResultContentBlock,
        ToolUseContentBlock,
    ) = _load_llm_dependencies()

    messages = [
        ChatMessage(
            role="assistant",
            content=[
                TextContentBlock(type="text", text="先查一下"),
                ToolUseContentBlock(
                    type="tool_use",
                    id="tool_1",
                    name="read_file",
                    input={"path": "README.md"},
                ),
            ],
        )
    ]

    formatted = llm.format_messages_for_openai(messages)

    assert formatted == [
        {
            "role": "assistant",
            "content": "先查一下",
            "tool_calls": [
                {
                    "id": "tool_1",
                    "type": "function",
                    "function": {
                        "name": "read_file",
                        "arguments": '{"path": "README.md"}',
                    },
                }
            ],
        }
    ]


def test_format_messages_for_openai_supports_tool_results_and_images() -> None:
    (
        llm,
        ChatMessage,
        ImageContentBlock,
        ImageSource,
        TextContentBlock,
        ToolResultContentBlock,
        _ToolUseContentBlock,
    ) = _load_llm_dependencies()

    messages = [
        ChatMessage(
            role="user",
            content=[
                TextContentBlock(type="text", text="这是工具输出"),
                ToolResultContentBlock(type="tool_result", tool_use_id="tool_1", content="done"),
            ],
        ),
        ChatMessage(
            role="user",
            content=[
                TextContentBlock(type="text", text="看看这个"),
                ImageContentBlock(
                    type="image",
                    source=ImageSource(
                        type="base64",
                        media_type="image/png",
                        data="abc123",
                    ),
                ),
            ],
        ),
    ]

    formatted = llm.format_messages_for_openai(messages)

    assert formatted[0] == {"role": "user", "content": "这是工具输出"}
    assert formatted[1] == {"role": "tool", "tool_call_id": "tool_1", "content": "done"}
    assert formatted[2] == {
        "role": "user",
        "content": [
            {"type": "text", "text": "看看这个"},
            {"type": "image_url", "image_url": {"url": "data:image/png;base64,abc123"}},
        ],
    }


def test_resolve_provider_prefers_explicit_configured_provider() -> None:
    llm, *_ = _load_llm_dependencies()

    original_api_key = llm.settings.llm_deepseek_api_key
    original_base_url = llm.settings.llm_deepseek_base_url
    original_models = llm.settings.llm_deepseek_models
    original_default_provider = llm.settings.llm_default_provider

    llm.settings.llm_deepseek_api_key = "secret"
    llm.settings.llm_deepseek_base_url = "https://api.deepseek.com/v1"
    llm.settings.llm_deepseek_models = "deepseek-chat"
    llm.settings.llm_default_provider = "deepseek"

    try:
        provider, model = llm.resolve_provider("deepseek", None)
    finally:
        llm.settings.llm_deepseek_api_key = original_api_key
        llm.settings.llm_deepseek_base_url = original_base_url
        llm.settings.llm_deepseek_models = original_models
        llm.settings.llm_default_provider = original_default_provider

    assert provider.name == "deepseek"
    assert model == "deepseek-chat"

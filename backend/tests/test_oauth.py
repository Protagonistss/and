from __future__ import annotations

import pytest


def test_create_and_decode_oauth_state_roundtrip() -> None:
    pytest.importorskip("httpx")
    pytest.importorskip("jwt")
    pytest.importorskip("pydantic_settings")
    pytest.importorskip("sqlalchemy")

    from slate_api.modules.auth.oauth import create_oauth_state, decode_oauth_state

    state = create_oauth_state("github", "http://localhost:1420/auth/callback")
    payload = decode_oauth_state(state)

    assert payload["provider"] == "github"
    assert payload["redirect_to"] == "http://localhost:1420/auth/callback"
    assert payload["exp"] > payload["iat"]

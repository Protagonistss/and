from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from slate_api.core.config import settings
from slate_api.infra.models import RefreshSession, User
from slate_api.modules.auth.schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenPairResponse, UserRead

PBKDF2_ITERATIONS = 600_000
JWT_ALGORITHM = "HS256"


class AuthError(Exception):
    pass


@dataclass
class TokenPayload:
    sub: str
    token_type: str
    exp: int
    iat: int
    jti: str
    sid: str | None = None


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _parse_session_id(raw: str | None) -> UUID:
    if not raw:
        raise AuthError("令牌缺少会话标识")
    try:
        return UUID(raw)
    except ValueError as exc:
        raise AuthError("令牌会话标识无效") from exc


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    )
    digest = base64.urlsafe_b64encode(derived).decode("utf-8")
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest}"


def verify_password(password: str, encoded_password: str | None) -> bool:
    if not encoded_password:
        return False

    try:
        algorithm, iterations_raw, salt, encoded_digest = encoded_password.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        int(iterations_raw),
    )
    candidate = base64.urlsafe_b64encode(derived).decode("utf-8")
    return hmac.compare_digest(candidate, encoded_digest)


def _encode_token(payload: dict[str, object]) -> str:
    return jwt.encode(payload, settings.secret_key, algorithm=JWT_ALGORITHM)


def decode_token(token: str, expected_type: str) -> TokenPayload:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise AuthError("无效的令牌") from exc

    token_type = payload.get("type")
    if token_type != expected_type:
        raise AuthError("令牌类型不正确")

    return TokenPayload(
        sub=str(payload["sub"]),
        token_type=str(token_type),
        exp=int(payload["exp"]),
        iat=int(payload["iat"]),
        jti=str(payload["jti"]),
        sid=str(payload["sid"]) if payload.get("sid") else None,
    )


def create_access_token(user_id: UUID) -> tuple[str, int]:
    now = _utcnow()
    expires_in_minutes = settings.access_token_expire_minutes
    expires_at = now + timedelta(minutes=expires_in_minutes)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "jti": secrets.token_urlsafe(18),
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return _encode_token(payload), expires_in_minutes * 60


def _create_refresh_token(user_id: UUID, session_id: UUID, refresh_jti: str, expires_at: datetime) -> str:
    now = _utcnow()
    payload = {
        "sub": str(user_id),
        "sid": str(session_id),
        "jti": refresh_jti,
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return _encode_token(payload)


def issue_token_pair(
    db: Session,
    user: User,
    *,
    user_agent: str | None,
    ip_address: str | None,
) -> TokenPairResponse:
    access_token, expires_in = create_access_token(user.id)
    expires_at = _utcnow() + timedelta(days=settings.refresh_token_expire_days)
    session = RefreshSession(
        user_id=user.id,
        refresh_jti=secrets.token_urlsafe(24),
        user_agent=user_agent,
        ip_address=ip_address,
        expires_at=expires_at,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    refresh_token = _create_refresh_token(user.id, session.id, session.refresh_jti, expires_at)
    return TokenPairResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserRead.model_validate(user),
    )


def rotate_refresh_token(
    db: Session,
    refresh_token: str,
    *,
    user_agent: str | None,
    ip_address: str | None,
) -> TokenPairResponse:
    payload = decode_token(refresh_token, "refresh")
    session = db.get(RefreshSession, _parse_session_id(payload.sid))
    if session is None or session.revoked_at is not None:
        raise AuthError("刷新会话不存在或已失效")

    if session.refresh_jti != payload.jti:
        raise AuthError("刷新令牌已失效，请重新登录")

    if session.expires_at <= _utcnow():
        raise AuthError("刷新令牌已过期，请重新登录")

    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        raise AuthError("用户不存在或已禁用")

    access_token, expires_in = create_access_token(user.id)
    session.refresh_jti = secrets.token_urlsafe(24)
    session.user_agent = user_agent
    session.ip_address = ip_address
    session.expires_at = _utcnow() + timedelta(days=settings.refresh_token_expire_days)
    db.add(session)
    db.commit()
    db.refresh(session)

    rotated_refresh = _create_refresh_token(user.id, session.id, session.refresh_jti, session.expires_at)
    return TokenPairResponse(
        access_token=access_token,
        refresh_token=rotated_refresh,
        expires_in=expires_in,
        user=UserRead.model_validate(user),
    )


def revoke_refresh_token(db: Session, refresh_token: str) -> None:
    payload = decode_token(refresh_token, "refresh")
    session = db.get(RefreshSession, _parse_session_id(payload.sid))
    if session is None:
        return
    session.revoked_at = _utcnow()
    db.add(session)
    db.commit()


def get_user_by_identifier(db: Session, identifier: str) -> User | None:
    stmt = select(User).where((User.email == identifier) | (User.username == identifier))
    return db.execute(stmt).scalar_one_or_none()


def register_user(
    db: Session,
    payload: RegisterRequest,
    *,
    user_agent: str | None,
    ip_address: str | None,
) -> TokenPairResponse:
    if db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="邮箱已存在")
    if db.execute(select(User).where(User.username == payload.username)).scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")

    user = User(
        email=payload.email,
        username=payload.username,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return issue_token_pair(db, user, user_agent=user_agent, ip_address=ip_address)


def login_user(
    db: Session,
    payload: LoginRequest,
    *,
    user_agent: str | None,
    ip_address: str | None,
) -> TokenPairResponse:
    user = get_user_by_identifier(db, payload.identifier)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="用户已禁用")

    return issue_token_pair(db, user, user_agent=user_agent, ip_address=ip_address)


def refresh_tokens(
    db: Session,
    payload: RefreshRequest,
    *,
    user_agent: str | None,
    ip_address: str | None,
) -> TokenPairResponse:
    try:
        return rotate_refresh_token(
            db,
            payload.refresh_token,
            user_agent=user_agent,
            ip_address=ip_address,
        )
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


def logout_user(db: Session, refresh_token: str | None) -> None:
    if not refresh_token:
        return

    try:
        revoke_refresh_token(db, refresh_token)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

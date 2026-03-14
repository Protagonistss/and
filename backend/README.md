# Slate Backend

`Slate Backend` 是 `Slate` 的独立 Python 后端服务，提供认证、OAuth 登录、会话存储和统一 LLM Gateway 能力。它按可独立迁移的服务来组织，不依赖根仓库的 `package.json`，后续可以单独拆分部署。

## 功能概览

- 账号注册、密码登录、JWT access token / refresh token
- GitHub、Gitee、Google OAuth 登录
- 会话与消息持久化
- 统一模型目录与流式聊天接口
- PostgreSQL / Redis 健康检查
- Alembic 数据库迁移

## 技术栈

- FastAPI
- SQLAlchemy 2
- Alembic
- PostgreSQL
- Redis
- `uv` 用于 Python 依赖与运行管理

## 代码结构

```text
backend/
  slate_api/
    main.py                 # FastAPI 入口
    core/                   # 配置、依赖、公共 schema
    infra/                  # 数据库、ORM、LLM provider 基础设施
    modules/
      auth/                 # 认证与 OAuth
      conversations/        # 会话与消息
      llm/                  # 模型目录与流式聊天
  alembic/                  # 数据库迁移
  tests/                    # 后端测试
  docker-compose.yml        # 本地 PostgreSQL / Redis
```

## API 概览

服务默认前缀为 `/api/v1`。

认证：

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/oauth/{provider}/start`
- `GET /auth/oauth/{provider}/callback`
- `GET /me`

会话：

- `GET /conversations`
- `POST /conversations`
- `GET /conversations/{conversation_id}`
- `GET /conversations/{conversation_id}/messages`
- `POST /conversations/{conversation_id}/messages`

LLM：

- `GET /llm/providers`
- `GET /llm/models`
- `POST /llm/chat/stream`

系统：

- `GET /healthz`

## 运行要求

- Python `3.12+`
- `uv`
- PostgreSQL
- Redis

如果本机没有安装 `uv`：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

## 快速开始

### 1. 创建虚拟环境并安装依赖

```powershell
cd backend
uv venv
uv sync
```

`uv sync` 会基于 [pyproject.toml](/E:/code/Protagonistss/Slate/backend/pyproject.toml) 安装依赖到默认的 `.venv`。

### 2. 准备环境变量

```powershell
copy .env.example .env
```

最少需要确认这些配置：

- `SECRET_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- 至少一组可用的 `LLM_*`

### 3. 启动基础依赖

项目自带的 [docker-compose.yml](/E:/code/Protagonistss/Slate/backend/docker-compose.yml) 会启动：

- PostgreSQL 16
- Redis 7

```powershell
cd backend
docker compose up -d
```

默认 compose 配置里的数据库是：

- DB: `slate`
- User: `postgres`
- Password: `postgres`

如果你本地已经有一套 PostgreSQL / Redis，或者密码不是这个值，直接修改 [`.env`](/E:/code/Protagonistss/Slate/backend/.env) 里的 `DATABASE_URL` / `REDIS_URL` 即可。当前仓库内的本地示例 `.env` 已经按另一套本地库配置，不要求你必须使用 compose 默认值。

### 4. 执行迁移

```powershell
cd backend
uv run alembic upgrade head
```

### 5. 启动服务

```powershell
cd backend
uv run uvicorn slate_api.main:app --reload
```

启动后可访问：

- OpenAPI: `http://localhost:8000/docs`
- Health: `http://localhost:8000/healthz`

## 环境变量

### 核心配置

- `APP_NAME`
- `APP_ENV`
- `API_PREFIX`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `DATABASE_URL`
- `REDIS_URL`
- `CORS_ORIGINS`

### OAuth 配置

支持的 provider：

- `github`
- `gitee`
- `google`

对应环境变量：

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_REDIRECT_URI`
- `GITEE_CLIENT_ID`
- `GITEE_CLIENT_SECRET`
- `GITEE_REDIRECT_URI`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

回调模式控制：

- `FRONTEND_OAUTH_SUCCESS_URL`
- `FRONTEND_OAUTH_FAILURE_URL`

当这两个值为空时，OAuth callback 会按 backend-only 模式直接返回 token JSON；只有显式配置了前端地址，或在 `/start` 请求里传了 `redirect_to`，才会跳回前端页面。

### LLM 配置

当前支持的 provider：

- `deepseek`
- `qwen`
- `zhipu`
- `doubao`

常用配置：

- `LLM_DEFAULT_PROVIDER`
- `LLM_REQUEST_TIMEOUT_SECONDS`
- `LLM_DEEPSEEK_*`
- `LLM_QWEN_*`
- `LLM_ZHIPU_*`
- `LLM_DOUBAO_*`

模型网关按 OpenAI-compatible 接口转发；如果某家网关地址不同，直接通过对应的 `*_BASE_URL` 覆盖即可。

## OAuth 登录

### 设计说明

当前后端 OAuth 默认是 backend-only 模式：

1. 客户端请求 `/api/v1/auth/oauth/{provider}/start`
2. 后端返回授权地址和 `state`
3. 用户完成授权
4. `/callback` 直接返回：
   - `access_token`
   - `refresh_token`
   - `expires_in`
   - `user`

这适合先把后端登录链路跑通，不依赖前端回调页。

### 本地回调地址

- GitHub: `http://localhost:8000/api/v1/auth/oauth/github/callback`
- Gitee: `http://localhost:8000/api/v1/auth/oauth/gitee/callback`
- Google: `http://localhost:8000/api/v1/auth/oauth/google/callback`

### GitHub

GitHub 使用 `OAuth App`：

1. `Homepage URL` 填 `http://localhost:8000`
2. `Authorization callback URL` 填 GitHub 对应 callback
3. 在 [`.env`](/E:/code/Protagonistss/Slate/backend/.env) 中填写：
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_REDIRECT_URI`

启动服务后访问：

```text
GET http://localhost:8000/api/v1/auth/oauth/github/start
```

### Gitee

Gitee 使用 `OAuth 应用`：

1. `应用主页` 填 `http://localhost:8000`
2. `应用回调地址` 填 Gitee 对应 callback
3. 在 [`.env`](/E:/code/Protagonistss/Slate/backend/.env) 中填写：
   - `GITEE_CLIENT_ID`
   - `GITEE_CLIENT_SECRET`
   - `GITEE_REDIRECT_URI`

启动服务后访问：

```text
GET http://localhost:8000/api/v1/auth/oauth/gitee/start
```

### Google

Google 使用 OAuth 2.0 Web Application：

1. Authorized redirect URI 填 Google 对应 callback
2. 在 [`.env`](/E:/code/Protagonistss/Slate/backend/.env) 中填写：
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`

## 常用开发命令

```powershell
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn slate_api.main:app --reload
uv run pytest
uv run python -m compileall slate_api alembic tests
```

## 测试

```powershell
cd backend
uv run pytest
```

当前测试覆盖重点包括：

- OAuth callback 行为
- 模型网关基础逻辑
- provider 解析与后端回调模式

## 部署说明

- 该服务可以作为独立 Python 服务部署
- 生产环境应替换 `SECRET_KEY`
- 生产环境应使用独立的 PostgreSQL / Redis
- OAuth 回调地址需要切换为实际部署域名
- 如需接前端回调页，可配置 `FRONTEND_OAUTH_SUCCESS_URL` / `FRONTEND_OAUTH_FAILURE_URL`

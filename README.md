# Slate

Slate 是一个由 AI 驱动的现代化代码编辑器，旨在通过深度集成的 AI Agent 和工具链，为开发者提供更智能、更高效的编程体验。

## 🌟 核心特性

- **AI Agent 执行**: 内置自主执行 Agent，能够根据自然语言描述完成复杂的工程任务。
- **Monaco 编辑器集成**: 采用与 VS Code 相同的编辑器内核，支持丰富的编程语言特性。
- **MCP 支持**: 支持 Model Context Protocol (MCP)，可轻松扩展 AI 的工具能力。
- **跨平台支持**: 基于 Tauri 构建，支持 Windows、macOS 和 Linux。

## 🏗️ 项目结构

- [**editor/**](./editor/README.md): 基于 React + Vite 的前端编辑器源码。
- [**backend/**](./backend/README.md): 基于 Python FastAPI 的后端服务，负责 LLM 网关和任务调度。
- [**native/**](./native/README.md) 基于 Rust 的 Tauri 原生壳代码，处理系统级 API 调用。

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) (建议 18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [Python 3.10+](https://www.python.org/)

### 开发模式

1. **安装前端依赖**:
   ```bash
   npm install
   ```

2. **启动后端服务**:
   详情请参阅 [backend/README.md](./backend/README.md)。

3. **启动 Tauri 开发窗口**:
   ```bash
   npm run tauri:dev
   ```

## 🛠️ 构建产物

```bash
npm run tauri:build
```

构建结果将根据平台生成在相应的 `native/target/release/bundle` 目录下。

## 🔧 运行时后端地址（Tauri 发布后可改）

如果你准备发布 editor，但 backend 需要独立部署，可以在运行时通过 `env.json` 配置后端地址（无需重新打包前端）。

- **项目级（优先）**：`<project>/.slate/env.json`
- **用户级（兜底）**：`~/.slate/env.json`

```json
{
  "backendUrl": "http://127.0.0.1:8000/api/v1"
}
```

优先级（从高到低）：项目级 → 用户级 → `VITE_BACKEND_URL` → 默认值。

## 📄 参考文档

- [前端开发指南](./editor/README.md)
- [后端开发指南](./backend/README.md)

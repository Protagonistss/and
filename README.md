# Tauri + Monaco 基础示例

使用 **Tauri 2**（Rust 桌面壳） + **Vite + React + TypeScript** 前端，集成 **Monaco Editor** 的桌面代码编辑器基础模板。

## 技术栈

- **Tauri 2**：桌面应用框架，Rust 后端
- **Vite + React + TypeScript**：前端构建与 UI
- **Monaco Editor**：VS Code 同款编辑器内核，支持语法高亮、多语言、IntelliSense 等

## 前置要求

- [Node.js](https://nodejs.org/)（建议 18+）
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri 依赖](https://v2.tauri.app/start/install/)（如 Windows 上的 WebView2、Visual Studio 构建工具等）

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（会先启动 Vite 再启动 Tauri 窗口）
npm run tauri dev

# 仅启动前端（不启动 Tauri）
npm run dev
```

## 构建产物

```bash
npm run tauri build
```

输出在 `src-tauri/target/release/`（或 debug 目录），具体路径见构建结束时的提示。

## 项目结构

```
and/
├── frontend/               # 前端源码
│   ├── main.tsx            # 入口，先加载 monaco-setup
│   ├── monaco-setup.ts     # Monaco Web Worker 配置（Vite 必须）
│   ├── MonacoEditor.tsx    # 封装好的 Monaco 组件
│   ├── App.tsx / App.css
│   └── vite-env.d.ts
├── src-tauri/              # Tauri Rust 工程（目录名由 Tauri 约定，不宜修改）
│   ├── src/
│   │   ├── lib.rs          # 应用启动与 Tauri 配置
│   │   └── main.rs
│   ├── capabilities/       # 权限与能力
│   ├── tauri.conf.json     # Tauri 配置（窗口、构建、图标等）
│   └── Cargo.toml
├── index.html
├── vite.config.ts
└── package.json
```

## Monaco 集成要点

1. **Worker 必须在首屏、且在任何 `monaco-editor` 引用之前配置**  
   在 `src/main.tsx` 最顶部执行 `import "./monaco-setup"`，在 `monaco-setup.ts` 里通过 Vite 的 `?worker` 引入各语言 worker 并设置 `self.MonacoEnvironment.getWorker`。

2. **使用 Vite 的 `getWorker` 方式**  
   与 Webpack 的 `getWorkerUrl` 不同，Vite 用 `import xxx from '...?worker'` 得到 Worker 构造函数，在 `getWorker` 里 `return new xxx()` 即可。

3. **窗口尺寸变化**  
   组件里已设置 `automaticLayout: true`，Monaco 会随容器尺寸变化重新布局。

## 图标

若构建报错缺少图标，可先生成一套再构建：

```bash
npm run tauri icon
```

按提示选择一张至少 512×512 的 PNG，会在 `src-tauri/icons/` 下生成各尺寸图标。

## 参考

- [Tauri 2 文档](https://v2.tauri.app/)
- [Monaco Editor 官方文档](https://microsoft.github.io/monaco-editor/)
- [Monaco + Vite 集成说明 (ESM)](https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md#using-vite)

// MCPServerForm - MCP 服务器配置表单组件
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { McpConfigScope } from "@/services/mcp";
import type { McpServerDraft } from "../MCPSettings";

export interface MCPServerFormProps {
  formOpen: boolean;
  draft: McpServerDraft;
  configText: string;
  scopeOptions: readonly { value: McpConfigScope; label: string }[];
  currentProject: { name: string; path: string } | null;
  parsedSuccessfully: boolean;
  onConfigTextChange: (value: string) => void;
  onDraftChange: (draft: McpServerDraft) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel: () => void;
  scopePathHint: string;
  scopePathLabel: string;
  isEditing: boolean;
}

export function MCPServerForm({
  formOpen,
  draft,
  configText,
  scopeOptions,
  currentProject,
  parsedSuccessfully,
  onConfigTextChange,
  onDraftChange,
  onSave,
  onDelete,
  onCancel,
  scopePathHint,
  scopePathLabel,
  isEditing,
}: MCPServerFormProps) {
  const [inputMode, setInputMode] = useState<"json" | "form">("json");

  // 默认 JSON 配置模板
  const defaultConfig = `{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    }
  }
}`;

  // 检查是否可以保存（JSON 模式下有内容，或者表单模式下有必填字段）
  const canSave =
    inputMode === "json"
      ? configText.trim().length > 0
      : draft.id.trim().length > 0 && draft.name.trim().length > 0;

  return (
    <AnimatePresence>
      {formOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0, overflow: "hidden" }}
          animate={{ opacity: 1, height: "auto", overflow: "hidden" }}
          exit={{ opacity: 0, height: 0, overflow: "hidden" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="border border-white/5 bg-black/20 rounded-xl flex flex-col mb-6"
        >
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-zinc-500" />
              <h3 className="text-[12px] font-medium text-zinc-300">
                {isEditing ? "Edit Server" : "Server Configuration"}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-black/40 rounded-md p-0.5">
                <button
                  onClick={() => setInputMode("json")}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    inputMode === "json"
                      ? "bg-zinc-700 text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setInputMode("form")}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    inputMode === "form"
                      ? "bg-zinc-700 text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  Form
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
                {inputMode === "json" ? "JSON" : "MANUAL"}
              </span>
            </div>
          </div>

          {/* Scope Selector - 仅在编辑模式显示 */}
          {isEditing && (
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <span className="text-[11px] text-zinc-500">Scope</span>
              <select
                value={draft.scope}
                onChange={(e) =>
                  onDraftChange({ ...draft, scope: e.target.value as McpConfigScope })
                }
                className="bg-transparent border-none text-[11px] text-zinc-400 focus:outline-none focus:text-zinc-300 cursor-pointer"
              >
                {scopeOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-zinc-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* JSON Mode */}
          {inputMode === "json" && (
            <div className="relative">
              <textarea
                value={configText}
                onChange={(e) => onConfigTextChange(e.target.value)}
                placeholder={defaultConfig}
                className="w-full h-[180px] bg-transparent border-none p-3 text-[12px] font-mono text-zinc-300 focus:outline-none focus:bg-white/[0.01] transition-colors resize-y placeholder:text-zinc-700 leading-relaxed block custom-scrollbar"
                spellCheck={false}
              />
              {/* 解析状态指示器 */}
              {configText.trim() && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/80 border border-white/5">
                  {parsedSuccessfully ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">Parsed successfully</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} className="text-amber-400" />
                      <span className="text-[10px] text-amber-400">Invalid JSON format</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Mode */}
          {inputMode === "form" && (
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                <label className="text-[11px] text-zinc-500">Server ID</label>
                <input
                  type="text"
                  value={draft.id}
                  onChange={(e) => onDraftChange({ ...draft, id: e.target.value })}
                  placeholder="my-server"
                  className="bg-black/40 border border-white/5 rounded px-2 py-1.5 text-[12px] text-zinc-300 placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                <label className="text-[11px] text-zinc-500">Name</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
                  placeholder="My Server"
                  className="bg-black/40 border border-white/5 rounded px-2 py-1.5 text-[12px] text-zinc-300 placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                <label className="text-[11px] text-zinc-500">Command</label>
                <input
                  type="text"
                  value={draft.command}
                  onChange={(e) => onDraftChange({ ...draft, command: e.target.value })}
                  placeholder="npx"
                  className="bg-black/40 border border-white/5 rounded px-2 py-1.5 text-[12px] text-zinc-300 font-mono placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-[80px_1fr] items-start gap-3">
                <label className="text-[11px] text-zinc-500 pt-1.5">Args</label>
                <textarea
                  value={draft.argsText}
                  onChange={(e) => onDraftChange({ ...draft, argsText: e.target.value })}
                  placeholder='-y&#10;@modelcontextprotocol/server-filesystem&#10;/path/to/files'
                  rows={3}
                  className="w-full bg-black/40 border border-white/5 rounded px-2 py-1.5 text-[12px] text-zinc-300 font-mono placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                <label className="text-[11px] text-zinc-500">CWD (opt)</label>
                <input
                  type="text"
                  value={draft.cwd}
                  onChange={(e) => onDraftChange({ ...draft, cwd: e.target.value })}
                  placeholder="/working/directory"
                  className="bg-black/40 border border-white/5 rounded px-2 py-1.5 text-[12px] text-zinc-300 font-mono placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-[80px_1fr] items-start gap-3">
                <label className="text-[11px] text-zinc-500 pt-1.5">Env</label>
                <textarea
                  value={draft.envText}
                  onChange={(e) => onDraftChange({ ...draft, envText: e.target.value })}
                  placeholder="API_KEY=your_key&#10;ENV_VAR=value"
                  rows={2}
                  className="w-full bg-black/40 border border-white/5 rounded px-2 py-1.5 text-[12px] text-zinc-300 font-mono placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none resize-y"
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-3 py-2.5 border-t border-white/5 flex items-center justify-between bg-black/40">
            <div className="flex flex-col">
              <p className="text-[11px] text-zinc-500">
                {isEditing
                  ? "Update the server configuration above."
                  : inputMode === "json"
                  ? "Paste your MCP server configuration JSON above."
                  : "Fill in the server configuration details above."}
              </p>
              <p className="text-[10px] text-zinc-600 font-mono mt-1">
                {scopePathLabel}: {scopePathHint}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && onDelete && (
                <button
                  onClick={onDelete}
                  className="px-3 py-1.5 rounded-md text-[12px] font-medium text-red-400/80 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={onCancel}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={!canSave}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-zinc-200 text-zinc-900 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditing ? "Save Changes" : "Save Config"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

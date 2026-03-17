// MCPServerForm - MCP 服务器配置表单组件
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Check, Terminal } from "lucide-react";
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
  const canSave = configText.trim().length > 0 && parsedSuccessfully;

  return (
    <AnimatePresence>
      {formOpen ? (
        <motion.div
          initial={{ opacity: 0, height: 0, overflow: "hidden" }}
          animate={{ opacity: 1, height: "auto", overflow: "hidden" }}
          exit={{ opacity: 0, height: 0, overflow: "hidden" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="mb-6 flex flex-col gap-2 pt-2 pb-6"
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-zinc-500" />
              <h3 className="text-[13px] font-medium text-zinc-200">
                {isEditing ? "Edit Server" : "Add MCP Server"}
              </h3>
            </div>
            <span className="rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-zinc-500">
              JSON
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2.5">
            <div className="flex flex-col">
              <span className="text-[11px] text-zinc-500">Config Scope</span>
              <span className="mt-1 font-mono text-[10px] text-zinc-600">
                {scopePathLabel}: {scopePathHint}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-[11px] text-zinc-500">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) =>
                    onDraftChange({ ...draft, enabled: event.target.checked })
                  }
                  className="h-3.5 w-3.5 rounded border-white/10 bg-black/40"
                />
                Enabled
              </label>
              <select
                value={draft.scope}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    scope: event.target.value as McpConfigScope,
                  })
                }
                className="cursor-pointer rounded border border-white/5 bg-black/40 px-2 py-1 text-[11px] text-zinc-400 focus:outline-none focus:text-zinc-200"
              >
                {scopeOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-zinc-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="group relative rounded-lg border border-white/5 bg-black/40 transition-colors focus-within:border-white/10">
            <textarea
              value={configText}
              onChange={(event) => onConfigTextChange(event.target.value)}
              className="custom-scrollbar block h-[180px] w-full resize-y border-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:ring-0"
              spellCheck={false}
            />
            <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2">
              {configText.trim() ? (
                <div className="flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[10px]">
                  {parsedSuccessfully ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Valid</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} className="text-amber-400" />
                      <span className="text-amber-400">Invalid</span>
                    </>
                  )}
                </div>
              ) : null}
              <div className="rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-zinc-500">
                JSON
              </div>
            </div>
          </div>

          <div className="mt-1 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-[12px] text-zinc-500">
                {isEditing
                  ? "Update the MCP server JSON above."
                  : "Paste your MCP server configuration JSON above."}
              </p>
              {!parsedSuccessfully && configText.trim() ? (
                <p className="mt-1 text-[11px] text-amber-400/80">
                  JSON 必须包含可解析的 MCP server 配置后才能保存。
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {isEditing && onDelete ? (
                <button
                  onClick={onDelete}
                  className="rounded-md px-3 py-1.5 text-[12px] font-medium text-red-400/80 transition-colors hover:bg-red-950/20 hover:text-red-400"
                >
                  Delete
                </button>
              ) : null}
              <button
                onClick={onCancel}
                className="rounded-md px-3 py-1.5 text-[12px] font-medium text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={!canSave}
                className="rounded-md border border-white/5 bg-white/10 px-4 py-1.5 text-[12px] font-medium text-zinc-100 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEditing ? "Save Changes" : "Save"}
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

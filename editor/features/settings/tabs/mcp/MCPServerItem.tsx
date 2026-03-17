// MCPServerItem - MCP 服务器项组件
import { AnimatePresence, motion } from "motion/react";
import { Plug, Terminal, Trash2 } from "lucide-react";
import type { McpServerStatus } from "@/services/mcp";

interface MCPServerItemProps {
  server: McpServerStatus;
  onToggle: (server: McpServerStatus) => Promise<void>;
  onEdit: (server: McpServerStatus) => void;
  onRetry: (server: McpServerStatus) => Promise<void>;
  onDelete: (server: McpServerStatus) => Promise<void>;
  expanded: boolean;
  onToggleExpanded: (serverId: string) => void;
}

export function MCPServerItem({
  server,
  onToggle,
  onEdit,
  onRetry,
  onDelete,
  expanded,
  onToggleExpanded,
}: MCPServerItemProps) {
  const Icon = server.transportType === "sse" ? Plug : Terminal;
  const primaryActionLabel = getPrimaryActionLabel(server);
  const showPrimaryAction =
    server.status === "connected" ||
    server.status === "error" ||
    server.status === "disconnected" ||
    !server.enabled;

  return (
    <div
      className="group relative flex flex-col rounded-lg border border-transparent transition-colors"
      style={{
        borderColor: expanded ? "rgba(255,255,255,0.05)" : "transparent",
        backgroundColor: expanded ? "rgba(0,0,0,0.2)" : "transparent",
      }}
    >
      <div className="z-10 flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-white/[0.03]">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-white/5 ${
              server.enabled ? "bg-zinc-900" : "bg-zinc-900/50 opacity-70"
            }`}
          >
            <Icon size={14} className={server.enabled ? "text-zinc-500" : "text-zinc-600"} />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span
                className={`truncate text-[13px] font-medium ${
                  server.enabled ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {server.name}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${statusDot(server.status)}`}></span>
                <span className={`text-[11px] ${server.enabled ? "text-zinc-500" : "text-zinc-600"}`}>
                  {describeMcpStatus(server.status)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-600">
              <span className="max-w-[240px] truncate font-mono">{server.transportSummary}</span>
              <span>·</span>
              <span>{server.toolCount} Tools</span>
              <span>·</span>
              <span>{server.scope === "project" ? "Project" : "Global"}</span>
            </div>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 pl-2 transition-opacity ${
            expanded ? "opacity-100" : "absolute right-4 opacity-0 group-hover:opacity-100"
          }`}
        >
          {showPrimaryAction ? (
            server.status === "connected" ? (
              <button
                onClick={() => void onToggle(server)}
                className="rounded border border-white/5 bg-white/10 px-3 py-1 text-[12px] text-zinc-200 transition-colors hover:bg-white/15"
              >
                {primaryActionLabel}
              </button>
            ) : server.enabled ? (
              <button
                onClick={() => void onRetry(server)}
                className="rounded border border-white/5 bg-white/10 px-3 py-1 text-[12px] text-zinc-200 transition-colors hover:bg-white/15"
              >
                {primaryActionLabel}
              </button>
            ) : (
              <button
                onClick={() => void onToggle(server)}
                className="rounded border border-white/5 bg-white/10 px-3 py-1 text-[12px] text-zinc-200 transition-colors hover:bg-white/15"
              >
                {primaryActionLabel}
              </button>
            )
          ) : null}
          <button
            onClick={() => onToggleExpanded(server.id)}
            className={`rounded px-2 py-1 text-[12px] transition-colors ${
              expanded ? "bg-white/10 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Config
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-2 mt-1 border-t border-white/5 px-4 pb-4 pt-3">
              <div className="overflow-x-auto rounded-md border border-white/5 bg-black/40 p-3">
                <pre className="text-[11px] leading-relaxed text-zinc-400">
                  <code>{serializeServerConfig(server)}</code>
                </pre>
              </div>
              {server.error || server.unsupportedReason ? (
                <p className="mt-3 text-[11px] text-amber-400/80">
                  {server.error || server.unsupportedReason}
                </p>
              ) : null}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => void onDelete(server)}
                  className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-red-400 transition-colors hover:text-red-300"
                >
                  <Trash2 size={12} />
                  Remove Server
                </button>
                {!server.enabled ? (
                  <button
                    onClick={() => void onToggle(server)}
                    className="rounded border border-white/5 bg-white/5 px-3 py-1 text-[11px] text-zinc-400 transition-colors hover:text-zinc-200"
                  >
                    Enable Server
                  </button>
                ) : null}
                <button
                  onClick={() => onEdit(server)}
                  className="rounded border border-white/5 bg-white/5 px-3 py-1 text-[11px] text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  Edit Configuration
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function getPrimaryActionLabel(server: McpServerStatus): string {
  if (!server.enabled) {
    return "Enable";
  }
  if (server.status === "connected") {
    return "Disconnect";
  }
  if (server.status === "error") {
    return "Retry";
  }
  if (server.status === "disconnected") {
    return "Reconnect";
  }
  return "";
}

function serializeServerConfig(server: McpServerStatus): string {
  const transport = server.config.transport;
  const config =
    transport.type === "stdio"
      ? {
          command: transport.command,
          ...(transport.args.length > 0 ? { args: transport.args } : {}),
          ...(server.config.cwd ? { cwd: server.config.cwd } : {}),
          ...(Object.keys(server.config.env).length > 0 ? { env: server.config.env } : {}),
        }
      : {
          url: transport.url,
          ...(Object.keys(server.config.env).length > 0 ? { env: server.config.env } : {}),
        };

  return JSON.stringify(config, null, 2);
}

function statusDot(status: McpServerStatus["status"]): string {
  switch (status) {
    case "connected":
      return "bg-emerald-500/80";
    case "connecting":
      return "bg-sky-400/80";
    case "approvalRequired":
      return "bg-amber-400/80";
    case "error":
      return "bg-red-400/80";
    case "disconnected":
      return "bg-zinc-500/80";
    case "disabled":
      return "bg-zinc-700";
    default:
      return "bg-zinc-700";
  }
}

function describeMcpStatus(status: McpServerStatus["status"]): string {
  switch (status) {
    case "connected":
      return "Connected";
    case "approvalRequired":
      return "Awaiting Approval";
    case "connecting":
      return "Connecting";
    case "disabled":
      return "Disabled";
    case "unsupported":
      return "Unsupported";
    case "error":
      return "Error";
    case "disconnected":
      return "Disconnected";
    default:
      return "Offline";
  }
}

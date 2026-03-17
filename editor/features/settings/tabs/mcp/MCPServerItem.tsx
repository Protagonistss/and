// MCPServerItem - MCP 服务器项组件
import { Terminal, Plug } from "lucide-react";
import type { McpServerStatus } from "@/services/mcp";

interface MCPServerItemProps {
  server: McpServerStatus;
  onToggle: (server: McpServerStatus) => Promise<void>;
  onEdit: (server: McpServerStatus) => void;
  onRetry: (server: McpServerStatus) => Promise<void>;
  onDelete: (server: McpServerStatus) => Promise<void>;
}

export function MCPServerItem({ server, onToggle, onEdit, onRetry, onDelete }: MCPServerItemProps) {
  const getServerIcon = () => {
    if (server.transportType === "sse") {
      return Plug;
    }
    return Terminal;
  };

  const Icon = getServerIcon();

  return (
    <div className="group flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-white/[0.03] transition-colors relative">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-md border border-white/5 flex items-center justify-center flex-shrink-0 ${
            server.enabled ? "bg-zinc-900" : "bg-zinc-900/50"
          } ${!server.enabled ? "opacity-70" : ""}`}
        >
          <Icon size={14} className={server.enabled ? "text-zinc-500" : "text-zinc-600"} />
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`text-[13px] font-medium truncate ${server.enabled ? "text-zinc-300" : "text-zinc-500"}`}
            >
              {server.name}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot(server.status)}`}></span>
              <span className={`text-[11px] ${server.enabled ? "text-zinc-500" : "text-zinc-600"}`}>
                {describeMcpStatus(server.status)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-600">
            <span className="font-mono truncate max-w-[200px]">
              {server.transportSummary}
            </span>
            <span>·</span>
            <span>{server.toolCount} Tools</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 bg-[#050505] shadow-[0_0_12px_8px_#050505] pl-2">
        {server.status === "error" ? (
          <button
            onClick={() => void onRetry(server)}
            className="text-[12px] text-zinc-200 bg-white/10 hover:bg-white/15 px-3 py-1 rounded transition-colors border border-white/5"
          >
            Retry
          </button>
        ) : server.enabled ? (
          <button
            onClick={() => void onToggle(server)}
            className="text-[12px] text-zinc-500 hover:text-zinc-300 px-2 py-1 transition-colors"
          >
            Disable
          </button>
        ) : (
          <button
            onClick={() => void onToggle(server)}
            className="text-[12px] text-zinc-200 bg-white/10 hover:bg-white/15 px-3 py-1 rounded transition-colors border border-white/5"
          >
            Enable
          </button>
        )}
        <button
          onClick={() => onEdit(server)}
          className="text-[12px] text-zinc-500 hover:text-zinc-300 px-2 py-1 transition-colors"
        >
          Config
        </button>
      </div>
    </div>
  );
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
    default:
      return "Offline";
  }
}

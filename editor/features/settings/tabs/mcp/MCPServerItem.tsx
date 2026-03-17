// MCPServerItem - MCP 服务器项组件
import type { McpServerStatus } from "@/services/mcp";

interface MCPServerItemProps {
  server: McpServerStatus;
  onToggle: (server: McpServerStatus) => Promise<void>;
  onEdit: (server: McpServerStatus) => void;
  onRetry: (server: McpServerStatus) => Promise<void>;
  onDelete: (server: McpServerStatus) => Promise<void>;
}

export function MCPServerItem({ server, onToggle, onEdit, onRetry, onDelete }: MCPServerItemProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${statusDot(server.status)}`} />
          <div>
            <div className="text-[13px] font-medium text-zinc-200">{server.name}</div>
            <div className="text-[10px] text-zinc-600">{describeMcpStatus(server.status)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void onToggle(server)}
            className="text-[11px] text-zinc-500 hover:text-zinc-300"
          >
            {server.enabled ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => onEdit(server)}
            className="text-[11px] text-zinc-500 hover:text-zinc-300"
          >
            Edit
          </button>
          {server.status === "error" && (
            <button
              onClick={() => void onRetry(server)}
              className="text-[11px] text-zinc-500 hover:text-zinc-300"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => void onDelete(server)}
            className="text-[11px] text-zinc-500 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function statusDot(status: McpServerStatus["status"]): string {
  switch (status) {
    case "connected":
      return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.45)]";
    case "connecting":
      return "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.35)]";
    case "approvalRequired":
      return "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.35)]";
    case "error":
      return "bg-red-400";
    default:
      return "bg-zinc-600";
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

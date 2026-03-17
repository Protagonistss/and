// MCPServerList - MCP 服务器列表组件
import type { McpServerStatus } from "@/services/mcp";
import { MCPServerItem } from "./MCPServerItem";

interface MCPServerListProps {
  servers: McpServerStatus[];
  isLoading: boolean;
  onToggle: (server: McpServerStatus) => Promise<void>;
  onEdit: (server: McpServerStatus) => void;
  onRetry: (server: McpServerStatus) => Promise<void>;
  onDelete: (server: McpServerStatus) => Promise<void>;
}

export function MCPServerList({
  servers,
  isLoading,
  onToggle,
  onEdit,
  onRetry,
  onDelete,
}: MCPServerListProps) {
  if (isLoading) {
    return (
      <div className="space-y-1">
        <div className="text-[12px] text-zinc-600">Loading servers...</div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="space-y-1">
        <div className="text-[12px] text-zinc-600">No servers configured yet.</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {servers.map((server) => (
        <MCPServerItem
          key={server.id}
          server={server}
          onToggle={onToggle}
          onEdit={onEdit}
          onRetry={onRetry}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

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
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">
        Configured Servers ({servers.length})
      </h3>
      {servers.length === 0 ? (
        <div className="text-[12px] text-zinc-600">No servers configured yet.</div>
      ) : (
        <div className="space-y-2">
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
      )}
    </section>
  );
}

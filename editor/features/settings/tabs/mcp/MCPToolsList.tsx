// MCPToolsList - MCP 工具列表组件
import type { McpToolDescriptor } from "@/services/mcp";

interface MCPToolsListProps {
  tools: McpToolDescriptor[];
}

export function MCPToolsList({ tools }: MCPToolsListProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">
          Available Tools ({tools.length})
        </h3>
      </div>
      {tools.length === 0 ? (
        <div className="text-[12px] text-zinc-600">No tools available. Connect an MCP server to get started.</div>
      ) : (
        <div className="space-y-2">
          {tools.map((tool) => (
            <MCPToolItem key={`${tool.serverId}:${tool.name}`} tool={tool} />
          ))}
        </div>
      )}
    </section>
  );
}

interface MCPToolItemProps {
  tool: McpToolDescriptor;
}

function MCPToolItem({ tool }: MCPToolItemProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-zinc-200">{tool.name}</span>
            <span className="text-[10px] text-zinc-600">{tool.serverName}</span>
          </div>
          {tool.description && (
            <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2">{tool.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

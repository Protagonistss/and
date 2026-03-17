// MCPAddButton - MCP 添加服务器按钮组件
import { Plus } from "lucide-react";

interface MCPAddButtonProps {
  onClick: () => void;
}

export function MCPAddButton({ onClick }: MCPAddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full rounded-lg border border-dashed border-zinc-700 py-3 text-[12px] text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
    >
      <Plus size={14} />
      Add MCP Server
    </button>
  );
}

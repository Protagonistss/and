// MCPAddButton - MCP 添加服务器按钮组件
import { Plus } from "lucide-react";

interface MCPAddButtonProps {
  onClick: () => void;
  isAdding?: boolean;
}

export function MCPAddButton({ onClick, isAdding = false }: MCPAddButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 shadow-sm group active:scale-95 ${
        isAdding
          ? "bg-white/10 border-white/20 text-white"
          : "bg-white/5 hover:bg-white/10 text-zinc-200 border-white/10"
      }`}
    >
      {isAdding ? (
        <Plus size={14} className="text-zinc-400 rotate-45" />
      ) : (
        <Plus size={14} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
      )}
      <span>{isAdding ? "Cancel" : "Add Server"}</span>
    </button>
  );
}

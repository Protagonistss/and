// MCPServerSearch - MCP 服务器搜索组件
import { Search } from "lucide-react";

export interface MCPServerSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MCPServerSearch({
  value,
  onChange,
  placeholder = "Search connected servers...",
}: MCPServerSearchProps) {
  return (
    <div className="relative group">
      <Search
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/20 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-[13px] text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-black/40 focus:ring-1 focus:ring-zinc-500/20 transition-all placeholder:text-zinc-600 shadow-sm"
      />
    </div>
  );
}

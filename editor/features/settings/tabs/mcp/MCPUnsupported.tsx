// MCPUnsupported - MCP 不支持状态组件
import { Terminal } from "lucide-react";

export function MCPUnsupported() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
      <Terminal size={42} className="mb-4 opacity-25 text-zinc-500" />
      <h2 className="text-[16px] font-medium text-zinc-300">MCP Not Supported</h2>
      <p className="mt-2 text-[13px] text-zinc-500">
        MCP is only available in the desktop app.
      </p>
    </div>
  );
}

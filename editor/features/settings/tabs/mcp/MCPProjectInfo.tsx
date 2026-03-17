// MCPProjectInfo - MCP 项目信息组件
interface MCPProjectInfoProps {
  currentProject: { name: string; path: string } | null;
}

export function MCPProjectInfo({ currentProject }: MCPProjectInfoProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">
        Project Scope
      </h3>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        {currentProject ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-zinc-200">{currentProject.name}</div>
              <div className="text-[11px] text-zinc-600 font-mono">{currentProject.path}</div>
            </div>
          </div>
        ) : (
          <div className="text-[12px] text-zinc-600">No project open</div>
        )}
      </div>
    </section>
  );
}

// ArtifactEmptyState - Artifact 空状态组件
import { FileCode } from "lucide-react";

export function ArtifactEmptyState() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-obsidian scrollbar-thin scrollbar-thumb-zinc-800">
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm space-y-3 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-500">
            <FileCode size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-300">No modified files yet</p>
            <p className="text-xs leading-relaxed text-zinc-500">
              Planning and reasoning stay in the panel above. Real file changes will appear here as expandable sections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

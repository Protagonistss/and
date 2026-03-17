// ArtifactContent - Artifact 内容显示组件
import type { ArtifactFileContentState } from "../hooks/useArtifactContent";

interface ArtifactContentProps {
  contentLines: string[];
  hasSummary: boolean;
  isAwaitingFileContent: boolean;
  isRefreshingFileContent: boolean;
  hasStoredFileContent: boolean;
  shouldShowFallbackPreview: boolean;
  previewLines: string[];
  sectionId: string;
  fileState: ArtifactFileContentState | null;
}

export function ArtifactContent({
  contentLines,
  isAwaitingFileContent,
  isRefreshingFileContent,
  hasStoredFileContent,
  shouldShowFallbackPreview,
  previewLines,
  sectionId,
  fileState,
}: ArtifactContentProps) {
  if (isAwaitingFileContent) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="mb-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
          <p className="text-xs text-zinc-500">Loading file content...</p>
        </div>
      </div>
    );
  }

  if (isRefreshingFileContent) {
    return (
      <div className="flex max-h-[26rem] overflow-x-auto overflow-y-auto overscroll-y-contain">
        <div className="flex min-w-[2.75rem] select-none flex-col border-r border-zinc-800/50 bg-[#0a0a0a] px-3 py-4 text-right font-mono text-xs leading-[1.6] text-zinc-700">
          {contentLines.map((_, index) => (
            <span key={`${sectionId}-refresh-line-${index}`}>{index + 1}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1 py-4 opacity-50">
          <pre className="px-4 font-mono text-xs leading-[1.6] text-zinc-200">
            {contentLines.map((line, index) => (
              <div key={`${sectionId}-refresh-content-${index}`}>
                {line || "\u00A0"}
              </div>
            ))}
          </pre>
          <div className="mx-4 mt-2 flex items-center gap-2 text-xs text-zinc-500">
            <div className="h-3 w-3 animate-spin rounded-full border border-zinc-600 border-t-transparent" />
            <span>Refreshing...</span>
          </div>
        </div>
      </div>
    );
  }

  if (hasStoredFileContent && contentLines.length > 0) {
    return (
      <div className="flex max-h-[26rem] overflow-x-auto overflow-y-auto overscroll-y-contain">
        <div className="flex min-w-[2.75rem] select-none flex-col border-r border-zinc-800/50 bg-[#0a0a0a] px-3 py-4 text-right font-mono text-xs leading-[1.6] text-zinc-700">
          {contentLines.map((_, index) => (
            <span key={`${sectionId}-line-${index}`}>{index + 1}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1 py-4">
          <pre className="px-4 font-mono text-xs leading-[1.6] text-zinc-200">
            {contentLines.map((line, index) => (
              <div key={`${sectionId}-content-${index}`}>
                {line || "\u00A0"}
              </div>
            ))}
          </pre>
        </div>
      </div>
    );
  }

  if (shouldShowFallbackPreview) {
    return (
      <div className="border-b border-zinc-800/50 bg-[#080808] px-4 py-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Summary
        </div>
        <div className="space-y-1 text-xs leading-relaxed text-zinc-400">
          {previewLines.map((line, index) => (
            <p key={`${sectionId}-fallback-${index}`}>{line}</p>
          ))}
        </div>
        {fileState?.error && (
          <div className="mt-2 text-[11px] text-red-400">
            Failed to load file: {fileState.error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 text-center text-xs text-zinc-500">
      No content available
    </div>
  );
}

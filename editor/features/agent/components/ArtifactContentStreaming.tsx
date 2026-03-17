// ArtifactContentStreaming - 流式内容显示组件
interface ArtifactContentStreamingProps {
  contentLines: string[];
  sectionId: string;
}

export function ArtifactContentStreaming({
  contentLines,
  sectionId,
}: ArtifactContentStreamingProps) {
  return (
    <div
      className="flex max-h-[26rem] overflow-x-auto overflow-y-auto overscroll-y-contain"
      onWheelCapture={(event) => event.stopPropagation()}
    >
      <div className="flex min-w-[2.75rem] select-none flex-col border-r border-zinc-800/50 bg-[#0a0a0a] px-3 py-4 text-right font-mono text-xs leading-[1.6] text-zinc-700">
        {contentLines.map((_, index) => (
          <span key={`${sectionId}-stream-line-${index}`}>{index + 1}</span>
        ))}
      </div>
      <div className="min-w-0 flex-1 py-4">
        <pre className="px-4 font-mono text-xs leading-[1.6] text-zinc-200">
          {contentLines.map((line, index) => (
            <div key={`${sectionId}-stream-content-${index}`}>
              {line || "\u00A0"}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

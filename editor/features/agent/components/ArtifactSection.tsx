// ArtifactSection - Artifact 单个文件区域组件
import { motion, AnimatePresence } from "motion/react";
import { FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArtifactSection } from "../hooks/useArtifactContent";
import { ArtifactContent } from "./ArtifactContent";
import { ArtifactContentStreaming } from "./ArtifactContentStreaming";

interface ArtifactSectionProps {
  section: ArtifactSection;
  isExpanded: boolean;
  previewLines: string[];
  hasSummary: boolean;
  isStreamingArtifact: boolean;
  contentLines: string[];
  isAwaitingFileContent: boolean;
  isRefreshingFileContent: boolean;
  hasStoredFileContent: boolean;
  shouldShowFallbackPreview: boolean;
  fileState: any;
  onToggle: () => void;
}

export function ArtifactSectionComponent({
  section,
  isExpanded,
  previewLines,
  hasSummary,
  isStreamingArtifact,
  contentLines,
  isAwaitingFileContent,
  isRefreshingFileContent,
  hasStoredFileContent,
  shouldShowFallbackPreview,
  fileState,
  onToggle,
}: ArtifactSectionProps) {
  return (
    <div className="flex flex-col border-b border-zinc-800/50">
      <ArtifactSectionHeader
        section={section}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-zinc-800/50 bg-[#050505]"
          >
            <div className="flex flex-col">
              {hasSummary && (
                <ArtifactSummary
                  sectionId={section.id}
                  previewLines={previewLines}
                />
              )}

              {isStreamingArtifact ? (
                <ArtifactContentStreaming
                  contentLines={contentLines}
                  sectionId={section.id}
                />
              ) : (
                <ArtifactContent
                  contentLines={contentLines}
                  hasSummary={hasSummary}
                  isAwaitingFileContent={isAwaitingFileContent}
                  isRefreshingFileContent={isRefreshingFileContent}
                  hasStoredFileContent={hasStoredFileContent}
                  shouldShowFallbackPreview={shouldShowFallbackPreview}
                  previewLines={previewLines}
                  sectionId={section.id}
                  fileState={fileState}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ArtifactSectionHeaderProps {
  section: ArtifactSection;
  isExpanded: boolean;
  onToggle: () => void;
}

function ArtifactSectionHeader({ section, isExpanded, onToggle }: ArtifactSectionHeaderProps) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex cursor-pointer select-none items-center gap-3 px-4 py-2 transition-colors",
        section.state === "active"
          ? "border-l-2 border-zinc-400 bg-zinc-900/30"
          : "hover:bg-zinc-900/50"
      )}
    >
      <FileCode
        size={14}
        className={cn("shrink-0", section.state === "active" ? "text-zinc-300" : "text-zinc-600")}
      />
      <span
        className={cn(
          "text-xs font-mono",
          section.state === "active" ? "text-zinc-200" : "text-zinc-400"
        )}
      >
        {section.path}
      </span>
      <div className="ml-auto flex items-center gap-2 text-[10px] font-mono">
        <span className="text-zinc-400">+{section.added}</span>
        {section.removed > 0 && <span className="text-zinc-600">-{section.removed}</span>}
        {section.state === "active" && (
          <span className="ml-2 uppercase tracking-widest text-zinc-500">Generating</span>
        )}
      </div>
    </div>
  );
}

interface ArtifactSummaryProps {
  sectionId: string;
  previewLines: string[];
}

function ArtifactSummary({ sectionId, previewLines }: ArtifactSummaryProps) {
  return (
    <div className="border-b border-zinc-800/50 bg-[#080808] px-4 py-3">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
        Summary
      </div>
      <div className="space-y-1 text-xs leading-relaxed text-zinc-400">
        {previewLines.map((line, index) => (
          <p key={`${sectionId}-summary-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}

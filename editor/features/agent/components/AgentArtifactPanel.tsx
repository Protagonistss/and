// AgentArtifactPanel - Artifact 面板组件
import { motion, AnimatePresence } from "motion/react";
import { FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import * as AgentViewUtils from "./utils/agentViewUtils";
import { useArtifactContent, type ArtifactSection } from "../hooks/useArtifactContent";
import { ArtifactEmptyState } from "./ArtifactEmptyState";
import { ArtifactContent } from "./ArtifactContent";
import { ArtifactContentStreaming } from "./ArtifactContentStreaming";
import { ArtifactSectionComponent } from "./ArtifactSection";

const { toPreviewLines, toFileContentLines } = AgentViewUtils;

export interface AgentArtifactPanelProps {
  artifactSections: ArtifactSection[];
  expandedFile: string | null;
  onSetExpandedFile: (path: string | null) => void;
  activeArtifactPath: string | null;
  isProcessing: boolean;
  currentStreamContent: string;
}

export function AgentArtifactPanel({
  artifactSections,
  expandedFile,
  onSetExpandedFile,
  activeArtifactPath,
  isProcessing,
  currentStreamContent,
}: AgentArtifactPanelProps) {
  const {
    ensureArtifactFileContent,
    updateLastVisibleContent,
    getLastVisibleContent,
    getFileContentState,
  } = useArtifactContent();

  if (artifactSections.length === 0) {
    return <ArtifactEmptyState />;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-obsidian scrollbar-thin scrollbar-thumb-zinc-800">
      <div className="flex flex-col pb-4">
        {artifactSections.map((section) => {
          const isExpanded = expandedFile === section.path;
          const previewLines = toPreviewLines(section.preview, 3);
          const hasSummary = section.preview.trim().length > 0;
          const fileState = getFileContentState(section.path);
          const snapshotContent = section.contentSnapshot || "";
          const lastVisibleContent = getLastVisibleContent(section.path);
          const isStreamingArtifact =
            Boolean(currentStreamContent.trim()) && section.path === activeArtifactPath;
          const hasStoredFileContent = Boolean(fileState?.content || snapshotContent || lastVisibleContent);
          const hasMatchingLoadedFileState =
            fileState?.cacheKey === section.cacheKey && fileState.status === "loaded";
          const hasMatchingErrorFileState =
            fileState?.cacheKey === section.cacheKey && fileState.status === "error";
          const isAwaitingFileContent =
            !isStreamingArtifact &&
            !hasStoredFileContent &&
            (!fileState ||
              fileState.cacheKey !== section.cacheKey ||
              fileState.status === "loading");
          const isRefreshingFileContent =
            !isStreamingArtifact && hasStoredFileContent && fileState?.status === "loading";
          const resolvedContent = isStreamingArtifact
            ? currentStreamContent
            : fileState?.content || snapshotContent || lastVisibleContent;

          if (resolvedContent) {
            updateLastVisibleContent(section.path, resolvedContent);
          }

          const contentLines = resolvedContent ? toFileContentLines(resolvedContent) : [];
          const shouldShowFallbackPreview =
            !resolvedContent &&
            hasMatchingErrorFileState &&
            hasSummary;

          return (
            <ArtifactSectionComponent
              key={section.id}
              section={section}
              isExpanded={isExpanded}
              previewLines={previewLines}
              hasSummary={hasSummary}
              isStreamingArtifact={isStreamingArtifact}
              contentLines={contentLines}
              isAwaitingFileContent={isAwaitingFileContent}
              isRefreshingFileContent={isRefreshingFileContent}
              hasStoredFileContent={hasStoredFileContent}
              shouldShowFallbackPreview={shouldShowFallbackPreview}
              fileState={fileState}
              onToggle={() => {
                if (isExpanded) {
                  onSetExpandedFile(null);
                  return;
                }
                onSetExpandedFile(section.path);
                ensureArtifactFileContent(section, currentStreamContent, activeArtifactPath);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

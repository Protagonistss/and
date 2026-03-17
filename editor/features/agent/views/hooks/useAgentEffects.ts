// useAgentEffects - Agent View 副作用处理
import { useEffect } from "react";
import { extractTextContent } from "@/features/agent/components/utils/agentViewUtils";
import type { Message } from "@/services/llm/types";
import type { ArtifactSection } from "@/features/agent/components";
import {
  resolveArtifactFilePath,
  readArtifactFileContent,
  getErrorMessage,
} from "@/features/agent/components/utils/agentViewUtils";
import type { ArtifactFileContentState } from "@/features/agent/components";

interface UseAgentEffectsParams {
  goalDraft: string;
  setGoalDraft: (value: string) => void;
  goalInputRef: React.RefObject<HTMLTextAreaElement | null>;
  reasoningScrollRef: React.RefObject<HTMLDivElement | null>;
  accessToken: string | null;
  catalogProviders: Array<{ name: string; configured: boolean; models: string[] }>;
  syncLLMProviders: (providers: Array<{ name: string; configured: boolean; models: string[] }>) => void;
  initializeCatalog: () => Promise<void>;
  clearCatalog: () => void;
  currentRun: { goal?: string } | null;
  latestUserMessage: Message | undefined;
  streamContent: string;
  isReasoningExpanded: boolean;
  reasoningEntries: unknown[];
  shouldShowReasoningError: boolean;
  currentProjectPath: string | null;
  workingDirectory: string;
  artifactSections: ArtifactSection[];
  expandedFile: string | null;
  setExpandedFile: (value: string | null) => void;
  setArtifactFileContents: React.Dispatch<React.SetStateAction<Record<string, ArtifactFileContentState>>>;
  artifactFileContents: Record<string, ArtifactFileContentState>;
  artifactLastVisibleContentRef: React.MutableRefObject<Record<string, string>>;
  activeArtifactPath: string | null;
  activeStreamingSection: ArtifactSection | null;
  expandedArtifactSection: ArtifactSection | null;
  expandedArtifactPath: string | null;
  expandedArtifactCacheKey: string | null;
  isExpandedArtifactStreaming: boolean;
}

export function useAgentEffects(params: UseAgentEffectsParams) {
  const {
    goalDraft,
    setGoalDraft,
    goalInputRef,
    reasoningScrollRef,
    accessToken,
    catalogProviders,
    syncLLMProviders,
    initializeCatalog,
    clearCatalog,
    currentRun,
    latestUserMessage,
    streamContent,
    isReasoningExpanded,
    reasoningEntries,
    shouldShowReasoningError,
    currentProjectPath,
    workingDirectory,
    artifactSections,
    expandedFile,
    setExpandedFile,
    setArtifactFileContents,
    artifactFileContents,
    artifactLastVisibleContentRef,
    activeArtifactPath,
    activeStreamingSection,
    expandedArtifactSection,
    expandedArtifactPath,
    expandedArtifactCacheKey,
    isExpandedArtifactStreaming,
  } = params;

  // Initialize catalog when access token changes
  useEffect(() => {
    if (accessToken) {
      void initializeCatalog();
    } else {
      clearCatalog();
    }
  }, [accessToken, clearCatalog, initializeCatalog]);

  // Sync LLM providers when catalog changes
  useEffect(() => {
    if (catalogProviders.length > 0) {
      syncLLMProviders(catalogProviders);
    }
  }, [catalogProviders, syncLLMProviders]);

  // Update goal draft when current run goal changes
  useEffect(() => {
    const nextGoal = currentRun?.goal || extractTextContent(latestUserMessage);
    setGoalDraft(nextGoal || "");
  }, [currentRun?.goal, latestUserMessage, setGoalDraft]);

  // Auto-resize textarea
  useEffect(() => {
    const node = goalInputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 220)}px`;
  }, [goalDraft, goalInputRef]);

  // Auto-scroll reasoning panel
  useEffect(() => {
    if (!isReasoningExpanded) {
      return;
    }

    const node = reasoningScrollRef.current;
    if (!node) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [streamContent, isReasoningExpanded, reasoningEntries, shouldShowReasoningError, reasoningScrollRef]);

  // Reset artifact file contents when project changes
  useEffect(() => {
    setArtifactFileContents({});
    artifactLastVisibleContentRef.current = {};
  }, [currentProjectPath, workingDirectory, setArtifactFileContents, artifactLastVisibleContentRef]);

  // Reset expanded file when artifact sections change
  useEffect(() => {
    if (artifactSections.length === 0) {
      setExpandedFile(null);
      return;
    }

    if (!expandedFile) {
      return;
    }

    if (artifactSections.some((section) => section.path === expandedFile)) {
      return;
    }

    setExpandedFile(null);
  }, [artifactSections, expandedFile, setExpandedFile]);

  // Update streaming artifact content
  useEffect(() => {
    if (!streamContent.trim() || !activeArtifactPath) {
      return;
    }

    const streamCacheKey = activeStreamingSection?.cacheKey || `stream:${activeArtifactPath}`;
    setArtifactFileContents((state) => {
      const currentState = state[activeArtifactPath];
      if (
        currentState?.cacheKey === streamCacheKey &&
        currentState.content === streamContent &&
        currentState.status === "loading"
      ) {
        return state;
      }

      return {
        ...state,
        [activeArtifactPath]: {
          status: "loading",
          content: streamContent,
          cacheKey: streamCacheKey,
          source: "stream",
        },
      };
    });
  }, [activeArtifactPath, activeStreamingSection?.cacheKey, streamContent, setArtifactFileContents]);

  // Load expanded artifact file content
  useEffect(() => {
    if (!expandedArtifactSection || !expandedArtifactPath || !expandedArtifactCacheKey || isExpandedArtifactStreaming) {
      return;
    }

    const section = expandedArtifactSection;
    const existingFileState = artifactFileContents[section.path] || null;
    const resolvedPath = resolveArtifactFilePath(section.path, workingDirectory, currentProjectPath);

    if (!resolvedPath) {
      setArtifactFileContents((state) => ({
        ...state,
        [section.path]: {
          status: "error",
          content: "",
          cacheKey: section.cacheKey,
          source: "file",
          error: "Project path is unavailable for this artifact.",
        },
      }));
      return;
    }

    if (
      existingFileState?.cacheKey === section.cacheKey &&
      existingFileState.source === "file" &&
      (existingFileState.status === "loading" || existingFileState.status === "loaded")
    ) {
      return;
    }

    setArtifactFileContents((state) => ({
      ...state,
      [section.path]: {
        status: "loading",
        content: state[section.path]?.content || "",
        cacheKey: section.cacheKey,
        source: "file",
      },
    }));

    void readArtifactFileContent(resolvedPath)
      .then((content) => {
        setArtifactFileContents((state) => {
          if (state[section.path]?.cacheKey !== section.cacheKey) {
            return state;
          }

          return {
            ...state,
            [section.path]: {
              status: "loaded",
              content,
              cacheKey: section.cacheKey,
              source: "file",
            },
          };
        });
      })
      .catch((error) => {
        setArtifactFileContents((state) => {
          if (state[section.path]?.cacheKey !== section.cacheKey) {
            return state;
          }

          return {
            ...state,
            [section.path]: {
              status: "error",
              content: "",
              cacheKey: section.cacheKey,
              source: "file",
              error: getErrorMessage(error),
            },
          };
        });
      });
  }, [
    currentProjectPath,
    expandedArtifactCacheKey,
    expandedArtifactPath,
    expandedArtifactSection,
    isExpandedArtifactStreaming,
    workingDirectory,
    setArtifactFileContents,
  ]);
}

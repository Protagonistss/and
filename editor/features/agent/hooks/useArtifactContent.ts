// useArtifactContent - Artifact 文件内容管理 Hook
import { useRef, useState, useEffect } from "react";
import * as AgentViewUtils from "../components/utils/agentViewUtils";

const { readArtifactFileContent } = AgentViewUtils;

export interface ArtifactSection {
  id: string;
  path: string;
  state: "active" | "completed" | "pending";
  preview: string;
  contentSnapshot: string;
  added: number;
  removed: number;
  cacheKey: string;
}

export interface ArtifactFileContentState {
  status: "loading" | "loaded" | "error";
  content: string;
  cacheKey: string;
  source: "stream" | "file";
  error?: string;
}

export function useArtifactContent() {
  const artifactLastVisibleContentRef = useRef<Record<string, string>>({});
  const [artifactFileContents, setArtifactFileContents] = useState<Record<string, ArtifactFileContentState>>({});

  const ensureArtifactFileContent = async (
    section: ArtifactSection,
    currentStreamContent: string,
    activeArtifactPath: string | null
  ) => {
    const fileState = artifactFileContents[section.path];
    const hasMatchingLoadedFileState =
      fileState?.cacheKey === section.cacheKey && fileState.status === "loaded";
    const hasMatchingErrorFileState =
      fileState?.cacheKey === section.cacheKey && fileState.status === "error";
    const isAwaitingFileContent =
      !Boolean(currentStreamContent.trim()) &&
      section.path !== activeArtifactPath &&
      (!fileState ||
        fileState.cacheKey !== section.cacheKey ||
        fileState.status === "loading");

    if (hasMatchingLoadedFileState || hasMatchingErrorFileState || !isAwaitingFileContent) {
      return;
    }

    setArtifactFileContents((prev) => ({
      ...prev,
      [section.path]: {
        status: "loading",
        content: "",
        cacheKey: section.cacheKey,
        source: "file",
      },
    }));

    try {
      const content = await readArtifactFileContent(section.path);
      setArtifactFileContents((prev) => ({
        ...prev,
        [section.path]: {
          status: "loaded",
          content,
          cacheKey: section.cacheKey,
          source: "file",
        },
      }));
    } catch (error) {
      setArtifactFileContents((prev) => ({
        ...prev,
        [section.path]: {
          status: "error",
          content: "",
          cacheKey: section.cacheKey,
          source: "file",
          error: error instanceof Error ? error.message : "Failed to load file content.",
        },
      }));
    }
  };

  const updateLastVisibleContent = (path: string, content: string) => {
    if (content) {
      artifactLastVisibleContentRef.current[path] = content;
    }
  };

  const getLastVisibleContent = (path: string): string => {
    return artifactLastVisibleContentRef.current[path] || "";
  };

  const getFileContentState = (path: string): ArtifactFileContentState | null => {
    return artifactFileContents[path] || null;
  };

  return {
    artifactFileContents,
    ensureArtifactFileContent,
    updateLastVisibleContent,
    getLastVisibleContent,
    getFileContentState,
  };
}

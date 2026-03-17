// Agent View 工具函数
import { readTextFile } from "@/services/tauri/fs";
import { isAbsolutePath, joinPath } from "@/utils/pathUtils";
import type { Message } from "@/services/llm/types";
import type { AgentRun, AgentStep as RuntimeAgentStep, ReasoningEntry } from "@/stores";

export function extractTextContent(message: Message | undefined): string {
  if (!message) return "";
  if (typeof message.content === "string") return message.content;

  return message.content
    .map((block) => {
      if (block.type === "text") return block.text;
      if (block.type === "tool_use") return `Tool ${block.name}`;
      if (block.type === "tool_result") return block.content;
      return "";
    })
    .join(" ")
    .trim();
}

export function truncateText(value: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

export function normalizeReasoningText(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Failed to load file content.";
}

export function toPreviewLines(content: string, maxLines = 18): string[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return ["Waiting for output..."];
  return normalized.split("\n").slice(0, maxLines);
}

export function toFileContentLines(content: string): string[] {
  const normalized = content.replace(/\r\n/g, "\n");
  return normalized.length > 0 ? normalized.split("\n") : [""];
}

export function sanitizePathSegment(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "artifact"
  );
}

export function buildStepSummary(step: RuntimeAgentStep): string {
  if (step.summary.trim()) return step.summary.trim();
  if (step.evidence.length > 0) return step.evidence[step.evidence.length - 1];

  switch (step.status) {
    case "running":
      return "Step in progress.";
    case "completed":
      return "Step completed.";
    case "blocked":
      return "Step is blocked and needs attention.";
    case "cancelled":
      return "Step was cancelled.";
    default:
      return "Waiting to start.";
  }
}

export function buildReasoningFallback(run: AgentRun | null): ReasoningEntry[] {
  if (!run) return [];

  const activeStep = run.activeStepId
    ? run.steps.find((step) => step.id === run.activeStepId) || null
    : run.steps.find((step) => step.status === "running") || null;

  const fallbackText =
    run.phase === "planning"
      ? "Drafting execution plan..."
      : run.phase === "executing" && activeStep
      ? `Working on ${activeStep.title}...`
      : run.phase === "paused"
      ? "Review the plan and continue when ready."
      : run.phase === "completed"
      ? "Execution complete. Waiting for the next goal."
      : run.error || "The run is blocked and needs intervention.";

  return [
    {
      id: "fallback",
      phase: run.phase === "planning" ? "planning" : "execution",
      text: fallbackText,
      stepId: activeStep?.id || null,
      createdAt: run.updatedAt,
    },
  ];
}

export function buildReasoningFromLastAssistantMessage(run: AgentRun): ReasoningEntry[] {
  const message = run.lastAssistantMessage.trim();
  if (!message) {
    return [];
  }

  return [
    {
      id: "assistant-fallback",
      phase: run.phase === "planning" ? "planning" : "execution",
      text: message,
      stepId: run.activeStepId,
      createdAt: run.updatedAt,
    },
  ];
}

export function buildTopActionLabel(run: AgentRun | null, isProcessing: boolean): string {
  if (isProcessing) return "Pause Session";
  if (!run) return "Initialize";
  if (run.phase === "paused") return "Resume Session";
  return "Update Goal";
}

// Constants
export const ARTIFACT_FILE_READ_TIMEOUT_MS = 5000;

// Artifact file handling utilities
export async function readArtifactFileContent(path: string): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      readTextFile(path),
      new Promise<string>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Timed out while loading file content."));
        }, ARTIFACT_FILE_READ_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function resolveArtifactFilePath(
  artifactPath: string,
  workingDirectory: string,
  currentProjectPath: string | null
): string | null {
  const normalizedPath = artifactPath.trim();
  if (!normalizedPath) {
    return null;
  }

  if (isAbsolutePath(normalizedPath)) {
    return normalizedPath;
  }

  const basePath = workingDirectory.trim() || currentProjectPath?.trim() || "";
  if (!basePath) {
    return null;
  }

  return joinPath(basePath, normalizedPath);
}

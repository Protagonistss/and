import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Circle,
  CornerLeftUp,
  ExternalLink,
  FileCode,
  GitBranch,
  Globe,
  Layout,
  Loader2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentModelSelect } from "@/components/agent";
import { useAgent } from "@/hooks";
import { readTextFile } from "@/services/tauri/fs";
import { isAbsolutePath, joinPath } from "@/utils/pathUtils";
import {
  useAuthStore,
  useConversationStore,
  useLLMCatalogStore,
  useProjectStore,
  type AgentRun,
  type AgentStep as RuntimeAgentStep,
  type AgentStepStatus,
  type ReasoningEntry,
} from "@/stores";
import { useConfigStore } from "@/stores/configStore";
import type { Message } from "@/services/llm/types";

type ArtifactSectionState = "active" | "completed" | "pending";

interface DisplayStep {
  id: string;
  order: number;
  title: string;
  status: AgentStepStatus;
  summary: string;
  synthetic?: boolean;
}

interface ArtifactSection {
  id: string;
  path: string;
  state: ArtifactSectionState;
  preview: string;
  contentSnapshot: string;
  added: number;
  removed: number;
  cacheKey: string;
}

interface ArtifactFileContentState {
  status: "loading" | "loaded" | "error";
  content: string;
  cacheKey: string;
  source: "stream" | "file";
  error?: string;
}

interface ReasoningBlock {
  type: "heading" | "list" | "ordered-list" | "paragraph";
  level?: 2 | 3;
  text?: string;
  items?: string[];
  lines?: string[];
  start?: number;
}

function extractTextContent(message: Message | undefined): string {
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

function truncateText(value: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function normalizeReasoningText(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

function getErrorMessage(error: unknown): string {
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

const ARTIFACT_FILE_READ_TIMEOUT_MS = 5000;

async function readArtifactFileContent(path: string): Promise<string> {
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

function resolveArtifactFilePath(
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

function renderReasoningInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).filter(Boolean).flatMap((segment, segmentIndex) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}-code-${segmentIndex}`}
          className="rounded-sm border border-zinc-800 bg-zinc-900/70 px-1 py-0.5 text-zinc-200"
        >
          {segment.slice(1, -1)}
        </code>
      );
    }

    return segment
      .split(/(\*\*[^*]+\*\*)/g)
      .filter(Boolean)
      .map((part, partIndex) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={`${keyPrefix}-strong-${segmentIndex}-${partIndex}`} className="font-semibold text-zinc-200">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={`${keyPrefix}-text-${segmentIndex}-${partIndex}`}>{part}</Fragment>
        )
      );
  });
}

function parseReasoningBlocks(text: string): ReasoningBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReasoningBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let orderedListItems: string[] = [];
  let orderedListStart = 1;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push({ type: "paragraph", lines: paragraphLines });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ type: "list", items: listItems });
    listItems = [];
  };

  const flushOrderedList = () => {
    if (orderedListItems.length === 0) return;
    blocks.push({ type: "ordered-list", items: orderedListItems, start: orderedListStart });
    orderedListItems = [];
    orderedListStart = 1;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushOrderedList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      flushOrderedList();
      blocks.push({ type: "heading", level: 3, text: trimmed.slice(4).trim() });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushOrderedList();
      blocks.push({ type: "heading", level: 2, text: trimmed.slice(3).trim() });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      flushOrderedList();
      listItems.push(trimmed.replace(/^[-*]\s+/, "").trim());
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        if (orderedListItems.length === 0) {
          orderedListStart = Number(match[1]);
        }
        orderedListItems.push(match[2].trim());
        continue;
      }
    }

    flushList();
    flushOrderedList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushOrderedList();

  return blocks;
}

function ReasoningContent({ text, isStreaming = false }: { text: string; isStreaming?: boolean }) {
  const blocks = parseReasoningBlocks(text);

  return (
    <div className={cn("space-y-2", isStreaming ? "text-zinc-300" : "text-zinc-400")}>
      {blocks.map((block, blockIndex) => {
        if (block.type === "heading") {
          return (
            <div
              key={`heading-${blockIndex}`}
              className={cn(
                "font-semibold tracking-tight",
                block.level === 2 ? "text-sm text-zinc-200" : "text-[12px] text-zinc-300"
              )}
            >
              {renderReasoningInline(block.text || "", `heading-${blockIndex}`)}
            </div>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={`list-${blockIndex}`} className="space-y-1.5 pl-4">
              {(block.items || []).map((item, itemIndex) => (
                <li key={`list-${blockIndex}-${itemIndex}`} className="relative leading-relaxed">
                  <span className="absolute -left-3 top-[0.55rem] h-1 w-1 rounded-full bg-zinc-600" />
                  <span className="break-words">
                    {renderReasoningInline(item, `list-${blockIndex}-${itemIndex}`)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol
              key={`ordered-list-${blockIndex}`}
              start={block.start || 1}
              className="space-y-1.5 pl-6 marker:text-zinc-500"
            >
              {(block.items || []).map((item, itemIndex) => (
                <li key={`ordered-list-${blockIndex}-${itemIndex}`} className="break-words leading-relaxed pl-1">
                  {renderReasoningInline(item, `ordered-list-${blockIndex}-${itemIndex}`)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <div key={`paragraph-${blockIndex}`} className="space-y-1">
            {(block.lines || []).map((line, lineIndex) => (
              <div key={`paragraph-${blockIndex}-${lineIndex}`} className="whitespace-pre-wrap break-words leading-relaxed">
                {renderReasoningInline(line, `paragraph-${blockIndex}-${lineIndex}`)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function toPreviewLines(content: string, maxLines = 18): string[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return ["Waiting for output..."];
  return normalized.split("\n").slice(0, maxLines);
}

function toFileContentLines(content: string): string[] {
  const normalized = content.replace(/\r\n/g, "\n");
  return normalized.length > 0 ? normalized.split("\n") : [""];
}

function sanitizePathSegment(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "artifact"
  );
}

function buildStepSummary(step: RuntimeAgentStep): string {
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

function buildReasoningFallback(run: AgentRun | null): ReasoningEntry[] {
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

function buildReasoningFromLastAssistantMessage(run: AgentRun): ReasoningEntry[] {
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

function buildArtifactSections(run: AgentRun | null, streamContent: string): ArtifactSection[] {
  if (!run) return [];

  const activeStep = run.activeStepId
    ? run.steps.find((step) => step.id === run.activeStepId) || null
    : run.steps.find((step) => step.status === "running") || null;

  const sections: ArtifactSection[] = run.artifacts
    .filter((artifact) => artifact.kind === "file")
    .sort((left, right) => {
      const leftPriority = left.stepId === run.activeStepId ? 0 : 1;
      const rightPriority = right.stepId === run.activeStepId ? 0 : 1;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return left.createdAt - right.createdAt;
    })
    .map((artifact) => {
      const preview = artifact.preview.trim() || artifact.title;
      return {
        id: artifact.id,
        path: artifact.path,
        state:
          streamContent.trim() && artifact.stepId === run.activeStepId ? "active" : "completed",
        preview,
        contentSnapshot: artifact.contentSnapshot || "",
        added: Math.max(1, toPreviewLines(preview, 24).length),
        removed: 0,
        cacheKey: `${run.id}:${artifact.path}`,
      };
    });

  if (streamContent.trim()) {
    const activeFileArtifact = [...(activeStep?.artifactRefs || [])]
      .reverse()
      .find((artifact) => artifact.kind === "file");

    if (activeFileArtifact) {
      sections.unshift({
        id: "stream-output",
        path: activeFileArtifact.path,
        state: "active",
        preview: streamContent.trim(),
        contentSnapshot: "",
        added: Math.max(1, toPreviewLines(streamContent.trim(), 24).length),
        removed: 0,
        cacheKey: `${run.id}:${activeFileArtifact.path}`,
      });
    }
  }

  const seenPaths = new Set<string>();
  return sections.filter((section) => {
    if (seenPaths.has(section.path)) return false;
    seenPaths.add(section.path);
    return true;
  });
}

function buildTopActionLabel(run: AgentRun | null, isProcessing: boolean): string {
  if (isProcessing) return "Pause Session";
  if (!run) return "Initialize";
  if (run.phase === "paused") return "Resume Session";
  return "Update Goal";
}

function StepIcon({ status }: { status: AgentStepStatus }) {
  if (status === "completed") {
    return <CheckCircle2 size={14} className="text-zinc-500" />;
  }

  if (status === "running") {
    return (
      <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-zinc-300">
        <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 ai-pulse" />
      </div>
    );
  }

  if (status === "blocked") {
    return <AlertCircle size={14} className="text-red-400" />;
  }

  return <Circle size={14} className="text-zinc-700" />;
}

function AgentEmptyState({ onStart }: { onStart: (goal: string) => void }) {
  const [input, setInput] = useState("");
  const suggestions = [
    { icon: <Layout size={16} />, text: "Build a complete authentication flow with Next.js and Supabase" },
    { icon: <FileCode size={16} />, text: "Create a Kanban board application using React and Tailwind" },
    { icon: <Globe size={16} />, text: "Set up a landing page with dark mode and smooth scrolling" },
    { icon: <Terminal size={16} />, text: "Write a Python script to scrape hacker news and save to CSV" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-graphite bg-charcoal text-zinc-400 shadow-sm">
          <Bot size={18} />
        </div>
        <div>
          <h1 className="text-[14px] font-medium leading-tight tracking-tight text-zinc-200">
            New Agent Session
          </h1>
          <p className="mt-0.5 text-[13px] leading-tight text-zinc-500">
            Describe your goal and let the agent build it for you.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-8 flex flex-col rounded-xl border border-graphite bg-charcoal shadow-sm transition-all focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600/20"
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="What do you want to build today?"
          className="min-h-[120px] w-full resize-none bg-transparent p-4 pb-0 text-[15px] leading-relaxed text-zinc-200 placeholder-zinc-600 focus:outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && input.trim()) {
              event.preventDefault();
              onStart(input.trim());
            }
          }}
        />
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-1 text-zinc-500">
            <button className="rounded-lg p-2 transition-colors hover:bg-white/5 hover:text-zinc-300" title="Add context">
              <Plus size={16} />
            </button>
            <button className="rounded-lg p-2 transition-colors hover:bg-white/5 hover:text-zinc-300" title="Settings">
              <Settings size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <AgentModelSelect className="mr-2" />
            <div className="hidden items-center gap-1.5 text-[11px] font-medium text-zinc-500 sm:flex">
              <span>Press</span>
              <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-sans">Enter</kbd>
            </div>
            <button
              onClick={() => input.trim() && onStart(input.trim())}
              disabled={!input.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3.5 py-1.5 text-[13px] font-semibold text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play size={14} fill="currentColor" />
              Initialize
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <div className="mb-2 mt-2 flex items-center gap-3 px-1">
          <span className="text-[11px] font-medium text-zinc-600">Suggestions</span>
          <div className="h-px flex-1 bg-zinc-800/40" />
        </div>
        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
          {suggestions.map((item, index) => (
            <button
              key={index}
              onClick={() => onStart(item.text)}
              className="group flex items-center gap-2.5 rounded-lg border border-transparent bg-transparent px-2.5 py-2 text-left text-[12px] text-zinc-500 transition-all hover:border-zinc-800/60 hover:bg-zinc-800/20 hover:text-zinc-300"
            >
              <div className="shrink-0 scale-[0.85] text-zinc-600 transition-colors group-hover:text-zinc-400">
                {item.icon}
              </div>
              <span className="truncate">{item.text}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function AgentView() {
  const navigate = useNavigate();
  const goalInputRef = useRef<HTMLTextAreaElement | null>(null);
  const reasoningScrollRef = useRef<HTMLDivElement | null>(null);
  const artifactLastVisibleContentRef = useRef<Record<string, string>>({});
  const [goalDraft, setGoalDraft] = useState("");
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [artifactFileContents, setArtifactFileContents] = useState<Record<string, ArtifactFileContentState>>({});

  const accessToken = useAuthStore((state) => state.accessToken);
  const currentProvider = useConfigStore((state) => state.currentProvider);
  const workingDirectory = useConfigStore((state) => state.workingDirectory);
  const llmConfigs = useConfigStore((state) => state.llmConfigs);
  const syncLLMProviders = useConfigStore((state) => state.syncLLMProviders);
  const currentProjectPath = useProjectStore((state) => state.currentProject?.path || null);
  const catalogProviders = useLLMCatalogStore((state) => state.providers);
  const catalogLoading = useLLMCatalogStore((state) => state.isLoading);
  const catalogError = useLLMCatalogStore((state) => state.error);
  const initializeCatalog = useLLMCatalogStore((state) => state.initialize);
  const clearCatalog = useLLMCatalogStore((state) => state.clear);
  const createConversation = useConversationStore((state) => state.createConversation);
  const conversation = useConversationStore((state) =>
    state.currentConversationId
      ? state.conversations.find((item) => item.id === state.currentConversationId) || null
      : null
  );
  const {
    isProcessing,
    currentStreamContent,
    currentRun,
    error,
    sendMessage,
    resumeRun,
    retryStep,
    stopGeneration,
    reset,
  } = useAgent();

  const visibleMessages = useMemo(
    () => (conversation?.messages || []).filter((message) => message.role !== "system"),
    [conversation?.messages]
  );
  const latestUserMessage = useMemo(
    () => [...visibleMessages].reverse().find((message) => message.role === "user"),
    [visibleMessages]
  );

  const configuredProviders = useMemo(
    () => catalogProviders.filter((provider) => provider.configured && provider.models.length > 0),
    [catalogProviders]
  );
  const currentLLMConfig = currentProvider ? llmConfigs[currentProvider] : null;
  const providerReady =
    Boolean(accessToken) &&
    Boolean(currentProvider) &&
    Boolean(currentLLMConfig?.model) &&
    configuredProviders.some(
      (provider) => provider.name === currentProvider && provider.models.includes(currentLLMConfig.model)
    );

  useEffect(() => {
    if (accessToken) {
      void initializeCatalog();
    } else {
      clearCatalog();
    }
  }, [accessToken, clearCatalog, initializeCatalog]);

  useEffect(() => {
    if (catalogProviders.length > 0) {
      syncLLMProviders(catalogProviders);
    }
  }, [catalogProviders, syncLLMProviders]);

  useEffect(() => {
    const nextGoal = currentRun?.goal || extractTextContent(latestUserMessage);
    setGoalDraft(nextGoal || "");
  }, [currentRun?.goal, latestUserMessage]);

  useEffect(() => {
    const node = goalInputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 220)}px`;
  }, [goalDraft]);

  const displaySteps = useMemo<DisplayStep[]>(() => {
    if (!currentRun) return [];

    if (currentRun.steps.length === 0) {
      return [
        {
          id: "planning",
          order: 1,
          title: "Draft execution plan",
          status: currentRun.phase === "planning" ? "running" : "pending",
          summary: "Generating a structured execution plan for the current goal.",
          synthetic: true,
        },
      ];
    }

    return currentRun.steps.map((step) => ({
      id: step.id,
      order: step.order,
      title: step.title,
      status: step.status,
      summary: buildStepSummary(step),
    }));
  }, [currentRun]);

  const reasoningEntries = useMemo<ReasoningEntry[]>(() => {
    if (!currentRun) return [];

    const baseEntries =
      currentRun.reasoningEntries.length > 0
        ? currentRun.reasoningEntries
        : currentRun.lastAssistantMessage.trim()
        ? buildReasoningFromLastAssistantMessage(currentRun)
        : buildReasoningFallback(currentRun);

    const nextEntries = baseEntries.slice(-4);
    const normalizedPreview = normalizeReasoningText(currentStreamContent);
    const normalizedLastEntry = nextEntries.length > 0
      ? normalizeReasoningText(nextEntries[nextEntries.length - 1].text)
      : "";

    if (!normalizedPreview || normalizedPreview === normalizedLastEntry) {
      return nextEntries;
    }

    return [
      ...nextEntries,
      {
        id: "stream-preview",
        phase: (currentRun.phase === "planning" ? "planning" : "execution") as ReasoningEntry["phase"],
        text: currentStreamContent.trim(),
        stepId: currentRun.activeStepId,
        createdAt: currentRun.updatedAt,
      },
    ].slice(-4);
  }, [currentRun, currentStreamContent]);

  const shouldShowReasoningError =
    Boolean(currentRun?.error) &&
    (Boolean(currentRun?.reasoningEntries.length) || Boolean(currentRun?.lastAssistantMessage.trim()));

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
  }, [currentStreamContent, isReasoningExpanded, reasoningEntries, shouldShowReasoningError]);

  const artifactSections = useMemo(
    () => buildArtifactSections(currentRun, currentStreamContent),
    [currentRun, currentStreamContent]
  );

  useEffect(() => {
    setArtifactFileContents({});
    artifactLastVisibleContentRef.current = {};
  }, [currentProjectPath, workingDirectory]);

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
  }, [artifactSections, expandedFile]);

  const activeStep = useMemo(() => {
    if (!currentRun) return null;
    if (currentRun.activeStepId) {
      return currentRun.steps.find((step) => step.id === currentRun.activeStepId) || null;
    }
    return currentRun.steps.find((step) => step.status === "running") || null;
  }, [currentRun]);

  const activeArtifactPath =
    activeStep?.artifactRefs[activeStep.artifactRefs.length - 1]?.path ||
    artifactSections.find((section) => section.state === "active")?.path ||
    artifactSections[0]?.path ||
    null;
  const activeStreamingSection = useMemo(
    () =>
      currentStreamContent.trim() && activeArtifactPath
        ? artifactSections.find((section) => section.path === activeArtifactPath && section.state === "active") || null
        : null,
    [activeArtifactPath, artifactSections, currentStreamContent]
  );

  useEffect(() => {
    if (!currentStreamContent.trim() || !activeArtifactPath) {
      return;
    }

    const streamCacheKey = activeStreamingSection?.cacheKey || `stream:${activeArtifactPath}`;
    setArtifactFileContents((state) => {
      const currentState = state[activeArtifactPath];
      if (
        currentState?.cacheKey === streamCacheKey &&
        currentState.content === currentStreamContent &&
        currentState.status === "loading"
      ) {
        return state;
      }

      return {
        ...state,
        [activeArtifactPath]: {
          status: "loading",
          content: currentStreamContent,
          cacheKey: streamCacheKey,
          source: "stream",
        },
      };
    });
  }, [activeArtifactPath, activeStreamingSection?.cacheKey, currentStreamContent]);

  function ensureArtifactFileContent(section: ArtifactSection | null) {
    if (!section) {
      return;
    }

    const isStreamingSection = Boolean(currentStreamContent.trim()) && section.path === activeArtifactPath;
    if (isStreamingSection) {
      return;
    }

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
  }

  const expandedArtifactSection = useMemo(
    () => (expandedFile ? artifactSections.find((section) => section.path === expandedFile) || null : null),
    [artifactSections, expandedFile]
  );
  const expandedArtifactPath = expandedArtifactSection?.path || null;
  const expandedArtifactCacheKey = expandedArtifactSection?.cacheKey || null;
  const isExpandedArtifactStreaming =
    Boolean(currentStreamContent.trim()) &&
    expandedArtifactSection?.path === activeArtifactPath;

  useEffect(() => {
    if (!expandedArtifactSection || !expandedArtifactPath || !expandedArtifactCacheKey || isExpandedArtifactStreaming) {
      return;
    }

    ensureArtifactFileContent(expandedArtifactSection);
  }, [
    currentProjectPath,
    expandedArtifactCacheKey,
    expandedArtifactPath,
    isExpandedArtifactStreaming,
    workingDirectory,
  ]);

  const latestReasoning = reasoningEntries[reasoningEntries.length - 1] || null;
  const completedSteps = displaySteps.filter((step) => step.status === "completed").length;
  const hasSession = Boolean(currentRun);
  const hasPendingSteps = Boolean(currentRun?.steps.some((step) => step.status === "pending"));
  const canResumeCurrentRun =
    Boolean(currentRun) &&
    currentRun?.phase === "paused" &&
    hasPendingSteps;
  const hasDraftInstruction =
    Boolean(currentRun) &&
    goalDraft.trim() &&
    goalDraft.trim() !== currentRun?.goal.trim();
  const topActionLabel = buildTopActionLabel(currentRun, isProcessing);
  const activeModelLabel =
    providerReady && currentProvider && currentLLMConfig?.model
      ? `${currentProvider} · ${currentLLMConfig.model}`
      : accessToken
      ? "No model"
      : "Sign in";
  const footerMessage = error || currentRun?.error
    ? error || currentRun?.error || "Run blocked."
    : isProcessing
    ? `Writing ${activeArtifactPath || activeStep?.title || "artifacts"}...`
    : canResumeCurrentRun
    ? "Review the artifacts and approve when ready."
    : currentRun?.phase === "completed"
    ? "Execution completed. Update the goal to start a new run."
    : "Agent is ready for the next instruction.";

  const ensureAgentReady = () => {
    if (!accessToken) return false;
    if (catalogLoading && configuredProviders.length === 0) return false;
    if (catalogError && configuredProviders.length === 0) return false;
    if (!providerReady) return false;
    return true;
  };

  const handleRun = async (content: string) => {
    const next = content.trim();
    if (!next || isProcessing || !ensureAgentReady()) return;
    setGoalDraft(next);
    await sendMessage(next);
  };

  const handleContinue = async () => {
    if (isProcessing || !currentRun || !canResumeCurrentRun || !ensureAgentReady()) return;

    const instruction = hasDraftInstruction ? goalDraft.trim() : undefined;
    await resumeRun(instruction);

    if (instruction) {
      setGoalDraft(currentRun.goal);
    }
  };

  const handlePrimaryAction = async () => {
    if (isProcessing) {
      stopGeneration();
      return;
    }

    if (canResumeCurrentRun) {
      await handleContinue();
      return;
    }

    await handleRun(goalDraft);
  };

  const handleNewSession = () => {
    if (isProcessing) return;
    createConversation();
    reset();
    setGoalDraft("");
    setExpandedFile(null);
  };

  const handleEditStep = (step: DisplayStep) => {
    const prefix = `@Step ${step.order} (${step.title}): `;
    const nextGoal = goalDraft.trim() ? `${goalDraft.trim()}\n\n${prefix}` : prefix;
    setGoalDraft(nextGoal);

    window.requestAnimationFrame(() => {
      const node = goalInputRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(nextGoal.length, nextGoal.length);
    });
  };

  const handleRetryStep = (step: DisplayStep) => {
    if (step.synthetic || isProcessing) return;
    retryStep(step.id);
  };

  if (!hasSession) {
    return (
      <div className="flex h-full flex-1 flex-col justify-center space-y-8 overflow-y-auto p-4 pb-24 scrollbar-thin scrollbar-thumb-zinc-800 lg:p-6">
        <AgentEmptyState onStart={(goal) => void handleRun(goal)} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col space-y-6 overflow-y-auto p-4 pt-2 scrollbar-thin scrollbar-thumb-zinc-800 lg:p-6 lg:pt-4">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/50 text-zinc-400">
              <Bot size={20} />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Active Agent Task
                </h2>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                Autonomous Implementation
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void handlePrimaryAction()}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                isProcessing
                  ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  : "bg-zinc-100 text-zinc-900 hover:bg-white"
              )}
            >
              {isProcessing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              <span>{topActionLabel}</span>
            </button>
            <button
              onClick={handleNewSession}
              disabled={isProcessing}
              className="rounded-lg border border-zinc-800 p-2 text-zinc-500 transition-all hover:bg-zinc-800 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div className="group relative flex flex-col rounded-xl border border-graphite bg-charcoal shadow-lg transition-colors focus-within:border-zinc-700 focus-within:bg-zinc-900/50">
          <textarea
            ref={goalInputRef}
            className="min-h-[24px] w-full resize-none border-none bg-transparent px-3 pt-3 pb-0 text-[14px] font-normal leading-[1.5] text-zinc-300 placeholder-zinc-600 focus:outline-none"
            value={goalDraft}
            onChange={(event) => setGoalDraft(event.target.value)}
            placeholder="What do you want to build today?"
            rows={1}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && goalDraft.trim()) {
                event.preventDefault();
                void handlePrimaryAction();
              }
            }}
          />
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                title="Add context"
              >
                <Plus size={15} />
              </button>
              <button
                type="button"
                onClick={() => navigate("/settings?tab=models")}
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                title="Settings"
              >
                <Settings size={15} />
              </button>
            </div>
            <div className="flex items-center gap-3 pr-1">
              <AgentModelSelect className="mr-2" disabled={isProcessing} />
              <div className="hidden items-center gap-1.5 text-[11px] text-zinc-500 sm:flex">
                <span>Press</span>
                <kbd className="rounded border border-zinc-700 bg-zinc-800/50 px-1.5 py-0.5">Enter</kbd>
              </div>
              <button
                onClick={() => void handlePrimaryAction()}
                disabled={!goalDraft.trim() || isProcessing}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all",
                  goalDraft.trim() && !isProcessing
                    ? "bg-zinc-300 text-zinc-900 hover:bg-white"
                    : "cursor-not-allowed bg-zinc-800 text-zinc-500"
                )}
              >
                <Play size={12} fill="currentColor" />
                {canResumeCurrentRun ? "Continue" : "Initialize"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid h-full grid-cols-1 items-start gap-6 pb-10 lg:grid-cols-5">
        <div className="flex h-full flex-col lg:col-span-2">
          <div className="mb-4 flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold text-zinc-300">Execution Plan</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {completedSteps} / {displaySteps.length} Complete
            </span>
          </div>
          <div className="space-y-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
            {displaySteps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "group relative rounded-lg p-3 transition-all duration-200",
                  step.status === "running" ? "bg-zinc-800/40" : "hover:bg-zinc-800/20"
                )}
              >
                {step.status === "running" && (
                  <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full bg-zinc-300 shadow-[0_0_8px_rgba(212,212,216,0.5)]" />
                )}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <StepIcon status={step.status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className={cn(
                        "truncate text-sm font-medium transition-colors",
                        step.status === "completed"
                          ? "text-zinc-400"
                          : step.status === "running"
                          ? "text-zinc-100"
                          : step.status === "blocked"
                          ? "text-red-300"
                          : "text-zinc-600"
                      )}
                    >
                      {step.title}
                    </h4>
                    {step.summary && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                        {step.summary}
                      </p>
                    )}
                  </div>

                  {!step.synthetic && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded border border-zinc-800/50 bg-obsidian/80 p-0.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleEditStep(step)}
                        className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                        title="Refine Step"
                      >
                        <CornerLeftUp size={12} />
                      </button>
                      {(step.status === "completed" || step.status === "blocked") && (
                        <button
                          onClick={() => handleRetryStep(step)}
                          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                          title="Retry"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                      {step.status === "running" && (
                        <button
                          onClick={stopGeneration}
                          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                          title="Stop"
                        >
                          <Pause size={12} fill="currentColor" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex h-full min-h-[600px] flex-col lg:col-span-3">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-[#0a0a0a] shadow-2xl shadow-black/50">
            <div className="shrink-0 select-none border-b border-zinc-800/80 bg-charcoal/50 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsReasoningExpanded((value) => !value)}
                    className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
                  >
                    <Bot size={14} className={isReasoningExpanded ? "text-zinc-300" : "text-zinc-500"} />
                    <span>Agent Reasoning</span>
                    <ChevronDown
                      size={12}
                      className={cn(
                        "ml-1 transition-transform duration-200",
                        isReasoningExpanded ? "rotate-180 text-zinc-300" : "text-zinc-600"
                      )}
                    />
                  </button>
                  {!isReasoningExpanded && (
                    <span className="ml-2 max-w-[180px] truncate text-[10px] font-mono text-zinc-500">
                      {truncateText(latestReasoning?.text || "Waiting for instructions.", 72)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded border border-zinc-800/50 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                    <GitBranch size={10} />
                    {truncateText(currentRun?.model || activeModelLabel, 18)}
                  </div>
                  <button
                    onClick={() => navigate("/editor")}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                  >
                    <ExternalLink size={12} />
                    Preview
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isReasoningExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 overflow-hidden border-b border-zinc-800/80 bg-zinc-900/30"
                >
                  <div
                    ref={reasoningScrollRef}
                    className="max-h-[150px] overflow-y-auto p-4 font-mono text-xs leading-relaxed text-zinc-400 scrollbar-thin scrollbar-thumb-zinc-800"
                  >
                    <div className="flex gap-4">
                      <div className="mt-1 flex shrink-0 flex-col items-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                        <div className="my-1.5 h-full w-px bg-zinc-800" />
                      </div>
                      <div className="space-y-3 pb-2">
                        {reasoningEntries.map((entry) => (
                          <ReasoningContent
                            key={entry.id}
                            text={entry.text}
                            isStreaming={entry.id === "stream-preview"}
                          />
                        ))}
                        {shouldShowReasoningError && (
                          <div className="flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] leading-relaxed text-red-300">
                            <AlertCircle size={12} className="mt-0.5 shrink-0" />
                            <span>{currentRun?.error}</span>
                          </div>
                        )}
                        {isProcessing && currentStreamContent.trim() && (
                          <p className="mt-2 flex items-center gap-2 text-zinc-300">
                            <Loader2 size={10} className="animate-spin text-zinc-500" />
                            Streaming current output...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="min-h-0 flex-1 overflow-y-auto bg-obsidian scrollbar-thin scrollbar-thumb-zinc-800">
              {artifactSections.length === 0 ? (
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
              ) : (
                <div className="flex flex-col pb-4">
                  {artifactSections.map((section) => {
                    const isExpanded = expandedFile === section.path;
                    const previewLines = toPreviewLines(section.preview, 3);
                    const hasSummary = section.preview.trim().length > 0;
                    const fileState = artifactFileContents[section.path] || null;
                    const snapshotContent = section.contentSnapshot || "";
                    const lastVisibleContent = artifactLastVisibleContentRef.current[section.path] || "";
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
                      artifactLastVisibleContentRef.current[section.path] = resolvedContent;
                    }
                    const contentLines = resolvedContent ? toFileContentLines(resolvedContent) : [];
                    const shouldShowFallbackPreview =
                      !resolvedContent &&
                      hasMatchingErrorFileState &&
                      hasSummary;

                    return (
                      <div key={section.id} className="flex flex-col border-b border-zinc-800/50">
                        <div
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedFile(null);
                              return;
                            }

                            setExpandedFile(section.path);
                            ensureArtifactFileContent(section);
                          }}
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
                                  <div className="border-b border-zinc-800/50 bg-[#080808] px-4 py-3">
                                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                                      Summary
                                    </div>
                                    <div className="space-y-1 text-xs leading-relaxed text-zinc-400">
                                      {previewLines.map((line, index) => (
                                        <p key={`${section.id}-summary-${index}`}>{line}</p>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {isStreamingArtifact ? (
                                  <div
                                    className="flex max-h-[26rem] overflow-x-auto overflow-y-auto overscroll-y-contain"
                                    onWheelCapture={(event) => event.stopPropagation()}
                                  >
                                    <div className="flex min-w-[2.75rem] select-none flex-col border-r border-zinc-800/50 bg-[#0a0a0a] px-3 py-4 text-right font-mono text-xs leading-[1.6] text-zinc-700">
                                      {contentLines.map((_, index) => (
                                        <span key={`${section.id}-stream-line-${index}`}>{index + 1}</span>
                                      ))}
                                    </div>
                                    <div className="min-w-0 flex-1 py-4">
                                      <div className="mb-2 flex items-center gap-2 px-4 text-[11px] text-zinc-500">
                                        <Loader2 size={12} className="animate-spin text-zinc-500" />
                                        <span>Streaming current output...</span>
                                      </div>
                                      <pre className="whitespace-pre px-4 font-mono text-xs leading-[1.6] text-zinc-300">
                                        {contentLines.join("\n")}
                                        {isProcessing && (
                                          <span className="ml-1 inline-block h-3.5 w-1.5 animate-[pulse_1s_ease-in-out_infinite] align-middle bg-zinc-400" />
                                        )}
                                      </pre>
                                    </div>
                                  </div>
                                ) : isAwaitingFileContent ? (
                                  <div className="flex items-center gap-2 px-4 py-6 text-xs text-zinc-500">
                                    <Loader2 size={14} className="animate-spin text-zinc-500" />
                                    <span>Loading current file content...</span>
                                  </div>
                                ) : resolvedContent ? (
                                  <div
                                    className="flex max-h-[26rem] overflow-x-auto overflow-y-auto overscroll-y-contain"
                                    onWheelCapture={(event) => event.stopPropagation()}
                                  >
                                    <div className="flex min-w-[2.75rem] select-none flex-col border-r border-zinc-800/50 bg-[#0a0a0a] px-3 py-4 text-right font-mono text-xs leading-[1.6] text-zinc-700">
                                      {contentLines.map((_, index) => (
                                        <span key={`${section.id}-file-line-${index}`}>{index + 1}</span>
                                      ))}
                                    </div>
                                    <div className="min-w-0 flex-1 py-4">
                                      <div className="mb-2 flex items-center gap-2 px-4 text-[11px] text-zinc-600">
                                        <span>Current file content</span>
                                        {isRefreshingFileContent && (
                                          <>
                                            <Loader2 size={11} className="animate-spin text-zinc-600" />
                                            <span className="text-zinc-500">Refreshing...</span>
                                          </>
                                        )}
                                      </div>
                                      <pre className="whitespace-pre px-4 font-mono text-xs leading-[1.6] text-zinc-300">
                                        {contentLines.join("\n")}
                                      </pre>
                                    </div>
                                  </div>
                                ) : hasMatchingErrorFileState ? (
                                  <div className="space-y-3 px-4 py-4">
                                    <div className="flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] leading-relaxed text-red-300">
                                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                                      <span>{fileState.error || "Failed to load current file content."}</span>
                                    </div>
                                    {shouldShowFallbackPreview && (
                                      <div className="overflow-x-auto rounded-md border border-zinc-800/60 bg-[#080808] p-4 font-mono text-xs text-zinc-500">
                                        <pre>{previewLines.join("\n")}</pre>
                                      </div>
                                    )}
                                  </div>
                                ) : hasMatchingLoadedFileState && !resolvedContent ? (
                                  <div className="px-4 py-6 text-xs text-zinc-500">
                                    File is empty.
                                  </div>
                                ) : (
                                  <div className="px-4 py-6 text-xs text-zinc-500">
                                    No file preview available.
                                  </div>
                              )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-zinc-800/80 bg-charcoal/90 p-3 backdrop-blur">
              <div className="flex items-center gap-2.5">
                {error || currentRun?.error ? (
                  <AlertCircle size={14} className="text-red-400" />
                ) : isProcessing ? (
                  <Loader2 size={14} className="animate-spin text-zinc-400" />
                ) : (
                  <Bot size={14} className="text-zinc-500" />
                )}
                <span className="text-xs font-medium text-zinc-300">{footerMessage}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={isProcessing ? stopGeneration : undefined}
                  disabled={!isProcessing}
                  className="rounded-md border border-zinc-700/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Stop Generation
                </button>
                <button
                  onClick={() => void handleContinue()}
                  disabled={isProcessing || !canResumeCurrentRun}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    canResumeCurrentRun && !isProcessing
                      ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                      : "cursor-not-allowed bg-zinc-800 text-zinc-500 opacity-50"
                  )}
                >
                  Approve & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// AgentReasoningPanel - 推理面板组件
import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, ChevronDown, ExternalLink, GitBranch, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReasoningContent } from "./ReasoningContent";
import { truncateText } from "@/utils/string";
import type { ReasoningEntry } from "@/features/agent/store/types";

export interface AgentReasoningPanelProps {
  isReasoningExpanded: boolean;
  onToggleExpanded: () => void;
  reasoningEntries: ReasoningEntry[];
  latestReasoning: ReasoningEntry | null;
  shouldShowReasoningError: boolean;
  currentRun: { model?: string; error?: string } | null;
  activeModelLabel: string;
  isProcessing: boolean;
  currentStreamContent: string;
}

export function AgentReasoningPanel({
  isReasoningExpanded,
  onToggleExpanded,
  reasoningEntries,
  latestReasoning,
  shouldShowReasoningError,
  currentRun,
  activeModelLabel,
  isProcessing,
  currentStreamContent,
}: AgentReasoningPanelProps) {
  const reasoningScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isReasoningExpanded && reasoningScrollRef.current) {
      reasoningScrollRef.current.scrollTop = reasoningScrollRef.current.scrollHeight;
    }
  }, [reasoningEntries, isReasoningExpanded]);

  return (
    <div className="flex flex-col rounded-xl border border-graphite bg-charcoal shadow-lg">
      <div
        onClick={onToggleExpanded}
        className="flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-800/30"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
          >
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
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = "#/editor";
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <ExternalLink size={12} />
            Preview
          </button>
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
                  {shouldShowReasoningError && currentRun?.error && (
                    <div className="flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] leading-relaxed text-red-300">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      <span>{currentRun.error}</span>
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
    </div>
  );
}

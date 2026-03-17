// AgentControls - 控制按钮和输入区域
import { useRef, type KeyboardEvent } from "react";
import { Bot, Pause, Play, Plus, RotateCcw, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { AgentModelSelect } from "@/components/agent";

export interface AgentControlsProps {
  goalDraft: string;
  isProcessing: boolean;
  topActionLabel: string;
  canResumeCurrentRun: boolean;
  onGoalChange: (value: string) => void;
  onPrimaryAction: () => void;
  onNewSession: () => void;
}

export function AgentControls({
  goalDraft,
  isProcessing,
  topActionLabel,
  canResumeCurrentRun,
  onGoalChange,
  onPrimaryAction,
  onNewSession,
}: AgentControlsProps) {
  const navigate = useNavigate();
  const goalInputRef = useRef<HTMLTextAreaElement | null>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && goalDraft.trim()) {
      event.preventDefault();
      onPrimaryAction();
    }
  };

  return (
    <section className="space-y-4">
      {/* 标题和主操作按钮 */}
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
            onClick={onPrimaryAction}
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
            onClick={onNewSession}
            disabled={isProcessing}
            className="rounded-lg border border-zinc-800 p-2 text-zinc-500 transition-all hover:bg-zinc-800 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
            title="New Session"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* 目标输入框 */}
      <div className="group relative flex flex-col rounded-xl border border-graphite bg-charcoal shadow-lg transition-colors focus-within:border-zinc-700 focus-within:bg-zinc-900/50">
        <textarea
          ref={goalInputRef}
          className="min-h-[24px] w-full resize-none border-none bg-transparent px-3 pt-3 pb-0 text-[14px] font-normal leading-[1.5] text-zinc-300 placeholder-zinc-600 focus:outline-none"
          value={goalDraft}
          onChange={(event) => onGoalChange(event.target.value)}
          placeholder="What do you want to build today?"
          rows={1}
          onKeyDown={handleKeyDown}
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
              onClick={onPrimaryAction}
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
  );
}

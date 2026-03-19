// AgentControls - 控制按钮和输入区域
import { Bot, Pause, Play, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentComposer } from "@/features/agent/components/AgentComposer";

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
      <AgentComposer
        value={goalDraft}
        onChange={(next) => onGoalChange(next)}
        onSubmit={onPrimaryAction}
        disabled={isProcessing}
        placeholder="What do you want to build today?"
        primaryLabel={
          <>
            <Play size={12} fill="currentColor" />
            {canResumeCurrentRun ? "Continue" : "Initialize"}
          </>
        }
        canSubmit={Boolean(goalDraft.trim()) && !isProcessing}
        showModelSelect
        modelSelectDisabled={isProcessing}
        modelSelectClassName="mr-2"
        leftSlot={
          <>
            <button
              type="button"
              className="rounded-lg p-2 transition-colors hover:bg-white/5 hover:text-zinc-300"
              title="Add context"
              disabled={isProcessing}
            >
              <Plus size={16} />
            </button>
          </>
        }
        hintSlot={
          <div className="hidden items-center gap-1.5 text-[11px] font-medium text-zinc-500 sm:flex">
            <span>Press</span>
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-sans">Enter</kbd>
          </div>
        }
        textareaClassName="min-h-[120px] p-4 pb-0 text-[15px] leading-relaxed text-zinc-200"
      />
    </section>
  );
}

// AgentStepList - 步骤列表组件
import { CornerLeftUp, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepIcon } from "./StepIcon";
import type { AgentStepStatus } from "@/stores";

export interface DisplayStep {
  id: string;
  order: number;
  title: string;
  status: AgentStepStatus;
  summary: string;
  synthetic?: boolean;
}

export interface AgentStepListProps {
  displaySteps: DisplayStep[];
  activeStepId?: string | null;
  onSelectStep?: (step: DisplayStep) => void;
  onEditStep?: (step: DisplayStep) => void;
  onRetryStep?: (step: DisplayStep) => void;
}

export function AgentStepList({
  displaySteps,
  activeStepId,
  onSelectStep,
  onEditStep,
  onRetryStep,
}: AgentStepListProps) {
  if (displaySteps.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="max-w-sm space-y-3 text-center">
          <p className="text-sm font-medium text-zinc-300">No steps yet</p>
          <p className="text-xs leading-relaxed text-zinc-500">
            Start a task to see the execution plan here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
      {displaySteps.map((step) => (
        <div
          key={step.id}
          className={cn(
            "group relative rounded-lg p-3 transition-all duration-200",
            step.id === activeStepId
              ? "bg-zinc-800/60 ring-1 ring-zinc-700/60"
              : step.status === "running"
              ? "bg-zinc-800/40"
              : "hover:bg-zinc-800/20",
            onSelectStep && "cursor-pointer"
          )}
          onClick={() => onSelectStep?.(step)}
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
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {step.status === "blocked" && onRetryStep && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetryStep(step);
                    }}
                    className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                    title="Retry step"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
                {step.status === "completed" && onEditStep && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStep(step);
                    }}
                    className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                    title="Edit step"
                  >
                    <CornerLeftUp size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

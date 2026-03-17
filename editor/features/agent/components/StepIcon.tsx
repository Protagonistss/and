// StepIcon 组件 - 显示步骤状态的图标
import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import type { AgentStepStatus } from "@/stores";

interface StepIconProps {
  status: AgentStepStatus;
}

export function StepIcon({ status }: StepIconProps) {
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

// TimelineReasoningNode - Agent 推理节点
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineNode } from "./TimelineNode";
import type { ReasoningEntry } from "@/features/agent/store/types";

export interface TimelineReasoningNodeProps {
  entry?: ReasoningEntry | null;
  label?: string;
  subLabel?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TimelineReasoningNode({
  entry,
  label,
  subLabel,
  isExpanded,
  onToggle,
}: TimelineReasoningNodeProps) {
  const text = entry?.text || "Waiting for instructions.";

  return (
    <TimelineNode
      icon={<Bot size={12} className="text-zinc-500" />}
      label={label || "Reasoning"}
      subLabel={subLabel}
      preview={text}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className={cn(
        "text-[11px] text-zinc-500 font-mono leading-relaxed transition-all duration-300",
        isExpanded ? "" : "line-clamp-1"
      )}>
        <pre className="whitespace-pre-wrap">{text}</pre>
      </div>
    </TimelineNode>
  );
}

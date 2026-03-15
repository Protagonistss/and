import React, { useCallback, useEffect, useRef } from "react";
import { Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentModelSelect } from "./AgentModelSelect";

interface InputAreaProps {
  value: string;
  isProcessing: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  onStop: () => void;
  placeholder?: string;
}

export const InputArea: React.FC<InputAreaProps> = ({
  value,
  isProcessing,
  onChange,
  onSubmit,
  onStop,
  placeholder = "Describe what you want the agent to do next...",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = Boolean(value.trim()) && !isProcessing;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && canSubmit) {
      event.preventDefault();
      void onSubmit();
    }
  }, [canSubmit, onSubmit]);

  return (
    <div className="border-t border-graphite bg-charcoal p-4">
      <div className="flex flex-col rounded-xl border border-graphite bg-charcoal shadow-sm transition-all focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600/20">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isProcessing}
          rows={1}
          className="min-h-[104px] max-h-[200px] w-full resize-none bg-transparent p-4 pb-0 text-[15px] leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 select-none">
            <span>Shift + Enter for new line</span>
          </div>

          <div className="flex items-center gap-3">
            <AgentModelSelect className="mr-2" disabled={isProcessing} />

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 select-none mr-1">
              <span>Press</span>
              <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-sans">↵</kbd>
            </div>

            {isProcessing ? (
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                )}
                onClick={onStop}
                title="Stop generation"
              >
                <Square size={13} fill="currentColor" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  "bg-zinc-100 text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                )}
                onClick={() => void onSubmit()}
                disabled={!canSubmit}
                title="Send message"
              >
                <Play size={14} fill="currentColor" />
                <span>Send</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

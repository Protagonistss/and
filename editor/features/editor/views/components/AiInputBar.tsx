import { motion } from "motion/react";
import { ChevronDown, Sparkles, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_MODELS } from "../utils/editorConstants";

type AiStatus = "idle" | "generating" | "diff";

interface AiInputBarProps {
  activeFile: { path: string } | null;
  prompt: string;
  setPrompt: (value: string) => void;
  aiStatus: AiStatus;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  onAiSubmit: () => void;
  onResetState: (clearPrompt?: boolean) => void;
  onAcceptOrDiscard: () => void;
}

export function AiInputBar({
  activeFile,
  prompt,
  setPrompt,
  aiStatus,
  selectedModel,
  setSelectedModel,
  onAiSubmit,
  onResetState,
  onAcceptOrDiscard,
}: AiInputBarProps) {
  if (!activeFile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className={cn(
        "absolute bottom-12 left-1/2 -translate-x-1/2 slate-glass p-2 rounded-2xl border shadow-2xl flex items-center gap-2 z-50 w-[calc(100%-2rem)] max-w-xl transition-all duration-300",
        aiStatus === "generating"
          ? "border-zinc-700 bg-zinc-900/90 shadow-[0_0_30px_-5px_rgba(255,255,255,0.05)]"
          : "border-zinc-800"
      )}
    >
      <div className="flex items-center gap-2 pl-3 pr-2 border-r border-zinc-800/80">
        <Sparkles
          size={14}
          className={cn(
            "shrink-0 transition-colors",
            aiStatus === "generating" ? "text-zinc-100" : "text-zinc-300"
          )}
        />
      </div>

      <input
        type="text"
        placeholder={
          aiStatus === "generating"
            ? "Generating... (Press ESC to stop)"
            : aiStatus === "diff"
            ? "Ask AI to tweak this diff..."
            : "Ask AI to edit or generate..."
        }
        className="flex-1 bg-transparent border-none focus:outline-none text-sm text-zinc-200 placeholder-zinc-600 px-3"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onAiSubmit();
          }

          if (event.key === "Escape" && aiStatus === "generating") {
            onResetState(false);
          }
        }}
        readOnly={aiStatus === "generating"}
      />

      <div className="flex items-center gap-1.5 pr-1">
        {aiStatus === "generating" ? (
          <button
            onClick={() => onResetState(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors text-xs font-medium"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Stop & Edit
          </button>
        ) : aiStatus === "diff" ? (
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-500 border border-zinc-700 font-mono hidden sm:inline-block">
              ↵
            </kbd>
            <button
              onClick={onAiSubmit}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-xs font-medium"
              title="Follow up or regenerate"
            >
              <Zap size={14} />
              <span>Update</span>
            </button>
            <div className="w-px h-3.5 bg-zinc-800 mx-0.5" />
            <button
              onClick={onAcceptOrDiscard}
              className="px-3 py-1.5 rounded-lg bg-transparent text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium border border-zinc-800 hover:border-zinc-700"
            >
              Discard
            </button>
            <button
              onClick={onAcceptOrDiscard}
              className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors text-xs font-medium"
            >
              Accept
            </button>
          </div>
        ) : (
          <>
            <div className="relative group/model">
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="appearance-none bg-transparent hover:bg-zinc-800/40 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 pl-2 pr-5 py-1 rounded cursor-pointer outline-none transition-all w-[115px] truncate text-right"
              >
                {AI_MODELS.map((model) => (
                  <option
                    key={model.value}
                    value={model.value}
                    className="bg-zinc-900 text-zinc-300 py-1"
                  >
                    {model.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover/model:opacity-100 transition-opacity"
              />
            </div>

            <div className="w-px h-3.5 bg-zinc-800 mx-0.5" />

            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-500 border border-zinc-700 font-mono hidden sm:inline-block">
              ↵
            </kbd>
            <button
              onClick={onAiSubmit}
              disabled={!prompt.trim()}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                prompt.trim()
                  ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  : "text-zinc-700 cursor-not-allowed"
              )}
            >
              <Zap size={16} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

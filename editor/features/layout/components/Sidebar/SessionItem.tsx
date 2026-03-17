// SessionItem - Agent 会话项组件
import React, { type MouseEvent as ReactMouseEvent, useState, useEffect } from "react";
import { PenSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SessionItemProps {
  title: string;
  date: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  onDelete: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onRename: (title: string) => void;
}

export function SessionItem({
  title,
  date,
  isActive = false,
  disabled = false,
  onClick,
  onDelete,
  onRename,
}: SessionItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const commitRename = () => {
    setIsRenaming(false);
    const nextTitle = draftTitle.trim();
    if (nextTitle && nextTitle !== title) {
      onRename(nextTitle);
    } else {
      setDraftTitle(title);
    }
  };

  return (
    <div
      onClick={() => !disabled && !isRenaming && onClick()}
      onMouseLeave={() => setIsConfirmingDelete(false)}
      className={cn(
        "group relative flex flex-col gap-1 rounded-lg border px-3 py-2 transition-all",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        isActive ? "border-zinc-700 bg-zinc-800/80" : "border-transparent hover:bg-zinc-800/40"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {isRenaming ? (
          <input
            ref={inputRef}
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={commitRename}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitRename();
              }

              if (event.key === "Escape") {
                setDraftTitle(title);
                setIsRenaming(false);
              }
            }}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          />
        ) : (
          <span
            className={cn(
              "pr-10 text-sm font-medium",
              isActive ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"
            )}
          >
            {title}
          </span>
        )}

        {!isRenaming && (
          <div
            className={cn(
              "absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity",
              !disabled && "group-hover:opacity-100",
              isActive && !disabled && "opacity-100"
            )}
          >
            {isConfirmingDelete ? (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(event);
                    setIsConfirmingDelete(false);
                  }}
                  className="rounded bg-zinc-800/80 p-1 text-red-400 transition-colors hover:bg-zinc-700 hover:text-red-300"
                  title="Confirm"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsConfirmingDelete(false);
                  }}
                  className="rounded bg-zinc-800/80 p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                  title="Cancel"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    if (disabled) return;
                    setIsRenaming(true);
                  }}
                  className="rounded bg-zinc-800/80 p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                  title="Rename"
                >
                  <PenSquare size={12} />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    if (disabled) return;
                    setIsConfirmingDelete(true);
                  }}
                  className="rounded bg-zinc-800/80 p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!isRenaming && (
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-widest",
            isActive ? "text-zinc-500" : "text-zinc-600"
          )}
        >
          {isConfirmingDelete ? <span className="text-red-400/80">Confirm Delete?</span> : date}
        </span>
      )}
    </div>
  );
}

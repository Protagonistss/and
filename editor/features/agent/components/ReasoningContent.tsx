// ReasoningContent 组件 - 显示推理内容
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ReasoningBlock {
  type: "heading" | "list" | "ordered-list" | "paragraph";
  level?: 2 | 3;
  text?: string;
  items?: string[];
  lines?: string[];
  start?: number;
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

interface ReasoningContentProps {
  text: string;
  isStreaming?: boolean;
}

export function ReasoningContent({ text, isStreaming = false }: ReasoningContentProps) {
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

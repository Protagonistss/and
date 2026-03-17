// Editor constants and utility functions

export const AI_MODELS = [
  { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3.5-haiku", label: "Claude 3.5 Haiku" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
] as const;

export const DEFAULT_CURSOR = {
  lineNumber: 1,
  column: 1,
} as const;

export const EMPTY_FILE_TEMPLATE = `import React from 'react';

export default function Component() {
  return <div>Hello Slate</div>;
}
`;

export function formatLanguageLabel(language?: string): string {
  if (!language) return "Ready";

  const normalized = language.toLowerCase();
  const labels: Record<string, string> = {
    typescript: "TypeScript",
    javascript: "JavaScript",
    tsx: "TypeScript React",
    jsx: "JavaScript React",
    json: "JSON",
    css: "CSS",
    html: "HTML",
    markdown: "Markdown",
    md: "Markdown",
    plaintext: "Plain Text",
  };

  return labels[normalized] ?? language;
}

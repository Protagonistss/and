import { useEffect, useRef } from "react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";

export interface MonacoEditorProps {
  value?: string;
  language?: string;
  theme?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  height?: string | number;
  className?: string;
}

const defaultCode = `// Tauri + Monaco 基础示例
function hello() {
  console.log("Hello from Monaco Editor!");
}

hello();
`;

export function MonacoEditor({
  value = defaultCode,
  language = "javascript",
  theme = "vs-dark",
  readOnly = false,
  onChange,
  height = "100%",
  className = "",
}: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    monaco.editor.setTheme(theme);

    const editorInstance = monaco.editor.create(containerRef.current, {
      value,
      language,
      readOnly,
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      wordWrap: "on",
    });

    if (onChange) {
      const disposable = editorInstance.onDidChangeModelContent(() => {
        onChange(editorInstance.getValue());
      });
      return () => {
        disposable.dispose();
        editorInstance.dispose();
        editorRef.current = null;
      };
    }

    editorRef.current = editorInstance;
    return () => {
      editorInstance.dispose();
      editorRef.current = null;
    };
  }, [theme, language, readOnly]);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || ed.getValue() === value) return;
    ed.setValue(value);
  }, [value]);

  return (
    <div
      className={className}
      ref={containerRef}
      style={{ height, width: "100%", minHeight: 200 }}
    />
  );
}

import { useEffect, useState, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { Share2 } from "lucide-react";
import { MonacoEditor, type MonacoEditorRef } from "@/components/editor/MonacoEditor";
import { SimpleLogo } from "@/components/shared";
import { useEditorStore } from "@/stores/editorStore";
import { useProjectStore } from "@/stores";
import { getRecentProjects, type ProjectRecord } from "@/services/config";
import { DEFAULT_CURSOR, formatLanguageLabel } from "./utils/editorConstants";
import { EditorTab } from "./components/EditorTab";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { AiInputBar } from "./components/AiInputBar";
import { useEditorState } from "./hooks/useEditorState";

export function EditorView() {
  const editorRef = useRef<MonacoEditorRef | null>(null);
  const {
    openFiles,
    activeFilePath,
    closeFile,
    setActiveFile,
    updateFileContent,
    openFile,
    markFileModified,
    theme,
    fontSize,
    wordWrap,
    minimap,
    lineNumbers,
  } = useEditorStore();
  const { openProject, openProjectByPath, currentProject } = useProjectStore();
  const [cursorPosition, setCursorPosition] = useState<{ lineNumber: number; column: number }>(DEFAULT_CURSOR);
  const [recentProjects, setRecentProjects] = useState<ProjectRecord[]>([]);

  const editorState = useEditorState();

  const activeFile = openFiles.find((file) => file.path === activeFilePath) ?? null;

  const handleCreateFile = () => {
    const emptyTemplate = `import React from 'react';

export default function Component() {
  return <div>Hello Slate</div>;
}
`;
    openFile("/untitled.tsx", "untitled.tsx", emptyTemplate, "typescript");
  };

  // Load recent projects when no project is open
  useEffect(() => {
    if (!currentProject) {
      getRecentProjects().then(setRecentProjects).catch(console.error);
    }
  }, [currentProject]);

  // Auto-select first file when no active file
  useEffect(() => {
    if (!activeFilePath && openFiles.length > 0) {
      setActiveFile(openFiles[0].path);
    }
  }, [activeFilePath, openFiles, setActiveFile]);

  // Reset cursor and AI state when file changes
  useEffect(() => {
    if (!activeFile) {
      setCursorPosition(DEFAULT_CURSOR);
      editorState.resetAiState(true);
      return;
    }
    editorState.resetAiState(false);
  }, [activeFile?.path]);

  return (
    <div className="flex-1 h-full bg-transparent flex flex-col relative overflow-hidden">
      {/* File Tabs */}
      {openFiles.length > 0 && (
        <div className="h-9 border-b border-graphite bg-obsidian flex items-center overflow-x-auto select-none px-2 shrink-0">
          {openFiles.map((file) => (
            <EditorTab
              key={file.path}
              name={file.name}
              isActive={activeFilePath === file.path}
              isModified={file.isModified}
              onClick={() => setActiveFile(file.path)}
              onClose={() => closeFile(file.path)}
            />
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden bg-obsidian relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.02] to-transparent" />
        {activeFile ? (
          <div className="flex-1 min-w-0 h-full relative">
            <MonacoEditor
              ref={editorRef}
              value={activeFile.content}
              language={activeFile.language}
              theme={theme}
              fontSize={fontSize}
              wordWrap={wordWrap}
              minimap={minimap}
              lineNumbers={lineNumbers}
              height="100%"
              className="h-full"
              onChange={(value) => {
                updateFileContent(activeFile.path, value);
              }}
              onSave={() => {
                markFileModified(activeFile.path, false);
              }}
              onCursorPositionChange={(position) => {
                setCursorPosition({
                  lineNumber: position.lineNumber,
                  column: position.column,
                });
              }}
            />
          </div>
        ) : (
          <div className="flex-1 h-full bg-obsidian flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {currentProject ? (
              <div className="flex items-center gap-3 select-none">
                <SimpleLogo />
                <span className="text-[28px] font-bold text-zinc-100 tracking-wider opacity-80">SLATE</span>
              </div>
            ) : (
              <WelcomeScreen
                recentProjects={recentProjects}
                onOpenProject={openProject}
                onOpenProjectByPath={openProjectByPath}
              />
            )}
          </div>
        )}
      </div>

      {/* AI Input Bar */}
      <AnimatePresence>
        <AiInputBar
          activeFile={activeFile}
          prompt={editorState.prompt}
          setPrompt={editorState.setPrompt}
          aiStatus={editorState.aiStatus}
          selectedModel={editorState.selectedModel}
          setSelectedModel={editorState.setSelectedModel}
          onAiSubmit={() => {
            if (activeFile && editorState.prompt.trim() && editorState.aiStatus !== "generating") {
              editorState.handleAiSubmit();
            }
          }}
          onResetState={editorState.resetAiState}
          onAcceptOrDiscard={editorState.handleAcceptOrDiscard}
        />
      </AnimatePresence>

      {/* Status Bar */}
      <div className="h-6 bg-charcoal border-t border-graphite px-4 flex items-center justify-between text-[10px] font-medium text-zinc-500 uppercase tracking-wider shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>{formatLanguageLabel(activeFile?.language)}</span>
          </div>
          <span>
            Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}
          </span>
        </div>
        <div className="flex items-center gap-4 min-w-0">
          <span>UTF-8</span>
          <span className="hidden md:inline">
            {editorState.selectedModel === "claude-3.5-sonnet" && "Claude 3.5 Sonnet"}
            {editorState.selectedModel === "claude-3.5-haiku" && "Claude 3.5 Haiku"}
            {editorState.selectedModel === "gpt-4o-mini" && "GPT-4o Mini"}
          </span>
          <span className="flex items-center gap-1 hover:text-zinc-300 transition-colors cursor-pointer">
            <Share2 size={10} />
            Cloud Sync
          </span>
        </div>
      </div>
    </div>
  );
}

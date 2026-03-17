// useSettingsMcpCore - MCP 设置核心逻辑
import { useCallback, useMemo, useState } from "react";
import { useMcpStore, useProjectStore, useUIStore } from "@/stores";
import { confirmDialog } from "@/services/tauri/dialog";
import { isTauriEnvironment } from "@/services/tauri/deepLink";
import type {
  McpConfigScope,
  McpServerConfig,
  McpServerStatus,
} from "@/services/mcp";
import type { McpServerDraft } from "../tabs/MCPSettings";
import {
  DEFAULT_JSON_TEMPLATE,
  parseSnippetToServerConfig,
  draftFromServer,
  getScopePathInfo,
  createEmptyDraft,
} from "./mcpConfigUtils";

export function useSettingsMcpCore() {
  const addToast = useUIStore((state) => state.addToast);
  const currentProject = useProjectStore((state) => state.currentProject);
  const servers = useMcpStore((state) => state.servers);
  const tools = useMcpStore((state) => state.tools);
  const isLoading = useMcpStore((state) => state.isLoading);
  const saveServer = useMcpStore((state) => state.saveServer);
  const deleteServer = useMcpStore((state) => state.deleteServer);
  const toggleServer = useMcpStore((state) => state.toggleServer);
  const retryServer = useMcpStore((state) => state.retryServer);

  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<McpServerDraft>(createEmptyDraft("global"));
  const [configText, setConfigText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [parsedSuccessfully, setParsedSuccessfully] = useState(false);

  const mcpSupported = isTauriEnvironment();
  const { hint: scopePathHint, label: scopePathLabel } = useMemo(
    () => getScopePathInfo(draft.scope, currentProject),
    [draft.scope, currentProject],
  );

  const isEditing = editingServerId !== null;
  const scopeOptions: readonly { value: McpConfigScope; label: string }[] = [
    { value: "global", label: "Global" },
    { value: "project", label: "Project" },
  ];

  const openNewForm = useCallback(() => {
    const nextDraft = createEmptyDraft(currentProject ? "project" : "global");
    const parsedDraft = parseSnippetToServerConfig(DEFAULT_JSON_TEMPLATE, {
      scope: nextDraft.scope,
      enabled: nextDraft.enabled,
    });

    setDraft(nextDraft);
    setConfigText(DEFAULT_JSON_TEMPLATE);
    setEditingServerId(null);
    if (parsedDraft) {
      setDraft({
        ...parsedDraft,
        scope: nextDraft.scope,
        enabled: nextDraft.enabled,
      });
      setParsedSuccessfully(true);
    } else {
      setParsedSuccessfully(false);
    }
    setFormOpen(true);
  }, [currentProject]);

  const openEditForm = useCallback((server: McpServerStatus) => {
    const nextDraft = draftFromServer(server);
    setDraft(nextDraft);
    setConfigText(JSON.stringify(server.config, null, 2));
    setEditingServerId(server.id);
    setParsedSuccessfully(true);
    setFormOpen(true);
  }, []);

  const parseConfigText = useCallback(
    (text: string) => {
      if (!text.trim()) {
        setParsedSuccessfully(false);
        return;
      }

      const parsed = parseSnippetToServerConfig(text, {
        scope: draft.scope,
        enabled: draft.enabled,
      });

      if (parsed) {
        setDraft({
          ...parsed,
          scope: draft.scope,
          enabled: draft.enabled,
        });
        setParsedSuccessfully(true);
      } else {
        setParsedSuccessfully(false);
      }
    },
    [draft.enabled, draft.scope],
  );

  const handleDeleteDraft = useCallback(async () => {
    if (!editingServerId) return;

    const server = servers.find((item) => item.id === editingServerId);
    if (!server) return;

    try {
      await deleteServer(server.scope, server.id);
      setFormOpen(false);
      setEditingServerId(null);
      setParsedSuccessfully(false);
    } catch (error) {
      addToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete server",
      });
    }
  }, [addToast, deleteServer, editingServerId, servers]);

  const handleSaveServer = useCallback(async () => {
    const args = draft.argsText
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    const env = Object.fromEntries(
      draft.envText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((line) => {
          const idx = line.indexOf("=");
          if (idx === -1) return [line, ""];
          return [line.slice(0, idx), line.slice(idx + 1)];
        }),
    );

    const serverConfig: McpServerConfig = {
      id: draft.id,
      name: draft.name,
      enabled: draft.enabled,
      transport: {
        type: "stdio",
        command: draft.command,
        args,
      },
      cwd: draft.cwd || null,
      env,
    };

    try {
      await saveServer({ scope: draft.scope, server: serverConfig });
      setFormOpen(false);
      setEditingServerId(null);
      setParsedSuccessfully(false);
    } catch (error) {
      addToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to save server",
      });
    }
  }, [addToast, draft, saveServer]);

  const handleToggleServer = useCallback(async (server: McpServerStatus) => {
    try {
      await toggleServer({ scope: server.scope, id: server.id, enabled: !server.enabled });
    } catch (error) {
      addToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to toggle server",
      });
    }
  }, [addToast, toggleServer]);

  const handleRetryServer = useCallback(async (server: McpServerStatus) => {
    try {
      await retryServer({ scope: server.scope, id: server.id });
    } catch (error) {
      addToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to retry server",
      });
    }
  }, [addToast, retryServer]);

  const handleDeleteServer = useCallback(async (server: McpServerStatus) => {
    const confirmed = await confirmDialog(`Are you sure you want to delete "${server.name}"?`);
    if (!confirmed) return;

    try {
      await deleteServer(server.scope, server.id);
      setFormOpen(false);
      setEditingServerId(null);
      setParsedSuccessfully(false);
    } catch (error) {
      addToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete server",
      });
    }
  }, [addToast, deleteServer]);

  return {
    // Store values
    currentProject,
    servers,
    tools,
    isLoading,
    mcpSupported,
    // State
    formOpen,
    draft,
    configText,
    searchQuery,
    parsedSuccessfully,
    isEditing,
    scopeOptions,
    scopePathHint,
    scopePathLabel,
    // Setters
    setFormOpen,
    setDraft,
    setConfigText,
    setSearchQuery,
    // Actions
    openNewForm,
    openEditForm,
    handleSaveServer,
    handleToggleServer,
    handleRetryServer,
    handleDeleteServer,
    handleDeleteDraft,
    parseConfigText,
  };
}

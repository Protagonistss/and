// useSettingsMcp - 设置页面 MCP 配置相关逻辑
import { useCallback, useMemo, useState } from "react";
import { useMcpStore, useProjectStore, useUIStore } from "@/stores";
import { confirmDialog } from "@/services/tauri/dialog";
import { isTauriEnvironment } from "@/services/tauri/deepLink";
import type {
  McpConfigScope,
  McpServerConfig,
  McpServerStatus,
  McpToolDescriptor,
} from "@/services/mcp";
import type { McpServerDraft } from "../tabs/MCPSettings";

const DEFAULT_JSON_TEMPLATE = `{
  "mcpServers": {
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "~/test.db"]
    }
  }
}`;

export interface UseSettingsMcpResult {
  currentProject: ReturnType<typeof useProjectStore.getState>["currentProject"];
  servers: McpServerStatus[];
  tools: McpToolDescriptor[];
  isLoading: boolean;
  mcpSupported: boolean;
  scopeOptions: readonly { value: McpConfigScope; label: string }[];
  formOpen: boolean;
  draft: McpServerDraft;
  configText: string;
  searchQuery: string;
  parsedSuccessfully: boolean;
  setFormOpen: (open: boolean) => void;
  setDraft: React.Dispatch<React.SetStateAction<McpServerDraft>>;
  setConfigText: React.Dispatch<React.SetStateAction<string>>;
  setSearchQuery: (query: string) => void;
  openNewForm: () => void;
  openEditForm: (server: McpServerStatus) => void;
  handleSaveServer: () => Promise<void>;
  handleToggleServer: (server: McpServerStatus) => Promise<void>;
  handleRetryServer: (server: McpServerStatus) => Promise<void>;
  handleDeleteServer: (server: McpServerStatus) => Promise<void>;
  handleDeleteDraft: () => Promise<void>;
  parseConfigText: (text: string) => void;
  scopePathHint: string;
  scopePathLabel: string;
  isEditing: boolean;
}

function parseSnippetToServerConfig(
  text: string,
  fallback: Pick<McpServerDraft, "scope" | "enabled">,
): McpServerDraft | null {
  try {
    const parsed = JSON.parse(text) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "mcpServers" in parsed &&
      typeof parsed.mcpServers === "object" &&
      parsed.mcpServers !== null &&
      Array.isArray(parsed.mcpServers)
    ) {
      const servers = parsed.mcpServers as Array<{
        id: string;
        name?: string;
        enabled?: boolean;
        transport: {
          type: string;
          command?: string;
          args?: string[];
        };
      }>;

      if (servers.length > 0) {
        const serverConfig = servers[0];
        const transport = serverConfig.transport;

        if (transport?.type === "stdio" || transport?.type === "sse") {
          return {
            scope: fallback.scope,
            id: serverConfig.id,
            name: serverConfig.name || serverConfig.id,
            enabled: serverConfig.enabled ?? fallback.enabled,
            command: transport.type === "stdio" ? (transport.command || "") : "",
            argsText: transport.type === "stdio" ? (transport.args || []).join("\n") : "",
            cwd: "",
            envText: "",
          };
        }
      }
    }

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "mcpServers" in parsed &&
      typeof parsed.mcpServers === "object" &&
      parsed.mcpServers !== null &&
      !Array.isArray(parsed.mcpServers)
    ) {
      const servers = parsed.mcpServers as Record<string, unknown>;
      const firstServerId = Object.keys(servers)[0];
      if (!firstServerId) return null;

      const serverConfig = servers[firstServerId];
      if (
        typeof serverConfig === "object" &&
        serverConfig !== null &&
        "command" in serverConfig
      ) {
        const config = serverConfig as {
          command: string;
          args?: string[];
          cwd?: string;
          env?: Record<string, string>;
        };

        return {
          scope: fallback.scope,
          id: firstServerId,
          name: firstServerId,
          enabled: fallback.enabled,
          command: config.command || "",
          argsText: (config.args || []).join("\n"),
          cwd: config.cwd || "",
          envText: Object.entries(config.env || {})
            .map(([key, value]) => `${key}=${value}`)
            .join("\n"),
        };
      }
    }

    const serverConfig = parsed as Partial<McpServerConfig>;
    if (serverConfig.id && serverConfig.name && serverConfig.transport) {
      const transport = serverConfig.transport;
      if (transport.type === "stdio") {
        return {
          scope: fallback.scope,
          id: serverConfig.id,
          name: serverConfig.name,
          enabled: serverConfig.enabled ?? fallback.enabled,
          command: transport.command || "",
          argsText: (transport.args || []).join("\n"),
          cwd: serverConfig.cwd || "",
          envText: Object.entries(serverConfig.env || {})
            .map(([key, value]) => `${key}=${value}`)
            .join("\n"),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

function draftFromServer(server: McpServerStatus): McpServerDraft {
  const transport = server.config.transport;
  return {
    scope: server.scope,
    id: server.id,
    name: server.name,
    enabled: server.enabled,
    command: transport.type === "stdio" ? transport.command : "",
    argsText: transport.type === "stdio" ? transport.args.join("\n") : "",
    cwd: server.config.cwd || "",
    envText: Object.entries(server.config.env || {})
      .map(([key, value]) => `${key}=${value}`)
      .join("\n"),
  };
}

function serializeDraftToConfigText(draft: McpServerDraft): string {
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

  return JSON.stringify(
    {
      mcpServers: {
        [draft.id || "server-id"]: {
          command: draft.command,
          ...(args.length > 0 ? { args } : {}),
          ...(draft.cwd.trim() ? { cwd: draft.cwd.trim() } : {}),
          ...(Object.keys(env).length > 0 ? { env } : {}),
        },
      },
    },
    null,
    2,
  );
}

function getScopePathInfo(
  scope: McpConfigScope,
  currentProject: { name: string; path: string } | null,
): { hint: string; label: string } {
  if (scope === "project") {
    if (currentProject) {
      return {
        hint: `${currentProject.path}/.slate/mcps.json`,
        label: `Project config (${currentProject.name})`,
      };
    }
    return {
      hint: "No project open",
      label: "Project config",
    };
  }
  return {
    hint: "~/.slate/mcps.json",
    label: "Global config",
  };
}

const emptyDraft = (scope: McpConfigScope): McpServerDraft => ({
  scope,
  id: "",
  name: "",
  enabled: true,
  command: "",
  argsText: "",
  cwd: "",
  envText: "",
});

export function useSettingsMcp(): UseSettingsMcpResult {
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
  const [draft, setDraft] = useState<McpServerDraft>(emptyDraft("global"));
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

  const openNewForm = () => {
    const nextDraft = emptyDraft(currentProject ? "project" : "global");
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
  };

  const openEditForm = (server: McpServerStatus) => {
    const nextDraft = draftFromServer(server);
    setDraft(nextDraft);
    setConfigText(serializeDraftToConfigText(nextDraft));
    setEditingServerId(server.id);
    setParsedSuccessfully(true);
    setFormOpen(true);
  };

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

  const handleSaveServer = async () => {
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
  };

  const handleToggleServer = async (server: McpServerStatus) => {
    try {
      await toggleServer({ scope: server.scope, id: server.id, enabled: !server.enabled });
    } catch (error) {
      addToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to toggle server",
      });
    }
  };

  const handleRetryServer = async (server: McpServerStatus) => {
    try {
      await retryServer({ scope: server.scope, id: server.id });
    } catch (error) {
      addToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to retry server",
      });
    }
  };

  const handleDeleteServer = async (server: McpServerStatus) => {
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
  };

  return {
    currentProject,
    servers,
    tools,
    isLoading,
    mcpSupported,
    scopeOptions,
    formOpen,
    draft,
    configText,
    searchQuery,
    parsedSuccessfully,
    setFormOpen,
    setDraft,
    setConfigText,
    setSearchQuery,
    openNewForm,
    openEditForm,
    handleSaveServer,
    handleToggleServer,
    handleRetryServer,
    handleDeleteServer,
    handleDeleteDraft,
    parseConfigText,
    scopePathHint,
    scopePathLabel,
    isEditing,
  };
}

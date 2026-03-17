// useSettingsMcp - 设置页面 MCP 配置相关逻辑
import { useState } from "react";
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
  setFormOpen: (open: boolean) => void;
  setDraft: React.Dispatch<React.SetStateAction<McpServerDraft>>;
  setConfigText: React.Dispatch<React.SetStateAction<string>>;
  openNewForm: () => void;
  openEditForm: (server: McpServerStatus) => void;
  handleSaveServer: () => Promise<void>;
  handleToggleServer: (server: McpServerStatus) => Promise<void>;
  handleRetryServer: (server: McpServerStatus) => Promise<void>;
  handleDeleteServer: (server: McpServerStatus) => Promise<void>;
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

  const mcpSupported = isTauriEnvironment();

  const scopeOptions: readonly { value: McpConfigScope; label: string }[] = [
    { value: "global", label: "Global" },
    { value: "project", label: "Project" },
  ];

  const openNewForm = () => {
    setDraft(emptyDraft(currentProject ? "project" : "global"));
    setConfigText("");
    setFormOpen(true);
  };

  const openEditForm = (server: McpServerStatus) => {
    const transport = server.config.transport;
    const newDraft: McpServerDraft = {
      scope: server.scope,
      id: server.id,
      name: server.name,
      enabled: server.enabled,
      command: transport.type === 'stdio' ? transport.command : '',
      argsText: transport.type === 'stdio' ? transport.args.join("\n") : '',
      cwd: server.config.cwd || "",
      envText: Object.entries(server.config.env || {})
        .map(([key, value]) => `${key}=${value}`)
        .join("\n"),
    };
    setDraft(newDraft);
    setConfigText("");
    setFormOpen(true);
  };

  const handleSaveServer = async () => {
    const args = draft.argsText.split("\n").filter(Boolean);
    const env = Object.fromEntries(
      draft.envText
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const idx = line.indexOf("=");
          if (idx === -1) return [line, ""];
          return [line.slice(0, idx), line.slice(idx + 1)];
        })
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
    setFormOpen,
    setDraft,
    setConfigText,
    openNewForm,
    openEditForm,
    handleSaveServer,
    handleToggleServer,
    handleRetryServer,
    handleDeleteServer,
  };
}

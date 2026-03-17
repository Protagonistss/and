// useSettingsMcp - 设置页面 MCP 配置相关逻辑（重构版本）
import type {
  McpConfigScope,
  McpServerStatus,
  McpToolDescriptor,
} from "@/services/mcp";
import type { McpServerDraft } from "../tabs/MCPSettings";
import { useSettingsMcpCore } from "./useSettingsMcpCore";

export interface UseSettingsMcpResult {
  currentProject: ReturnType<typeof useSettingsMcpCore>["currentProject"];
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

/**
 * MCP Settings Hook - Main entry point
 * Provides all MCP server configuration functionality for the settings page
 */
export function useSettingsMcp(): UseSettingsMcpResult {
  const core = useSettingsMcpCore();

  return {
    currentProject: core.currentProject,
    servers: core.servers,
    tools: core.tools,
    isLoading: core.isLoading,
    mcpSupported: core.mcpSupported,
    scopeOptions: core.scopeOptions,
    formOpen: core.formOpen,
    draft: core.draft,
    configText: core.configText,
    searchQuery: core.searchQuery,
    parsedSuccessfully: core.parsedSuccessfully,
    setFormOpen: core.setFormOpen,
    setDraft: core.setDraft,
    setConfigText: core.setConfigText,
    setSearchQuery: core.setSearchQuery,
    openNewForm: core.openNewForm,
    openEditForm: core.openEditForm,
    handleSaveServer: core.handleSaveServer,
    handleToggleServer: core.handleToggleServer,
    handleRetryServer: core.handleRetryServer,
    handleDeleteServer: core.handleDeleteServer,
    handleDeleteDraft: core.handleDeleteDraft,
    parseConfigText: core.parseConfigText,
    scopePathHint: core.scopePathHint,
    scopePathLabel: core.scopePathLabel,
    isEditing: core.isEditing,
  };
}

// MCPSettings - MCP servers settings tab
import { motion } from "motion/react";
import type {
  McpConfigScope,
  McpServerStatus,
  McpToolDescriptor,
} from "@/services/mcp";
import { MCPUnsupported } from "./mcp/MCPUnsupported";
import { MCPProjectInfo } from "./mcp/MCPProjectInfo";
import { MCPToolsList } from "./mcp/MCPToolsList";
import { MCPServerList } from "./mcp/MCPServerList";
import { MCPAddButton } from "./mcp/MCPAddButton";

export interface McpServerDraft {
  scope: McpConfigScope;
  id: string;
  name: string;
  enabled: boolean;
  command: string;
  argsText: string;
  cwd: string;
  envText: string;
}

export interface MCPSettingsProps {
  mcpSupported: boolean;
  currentProject: { name: string; path: string } | null;
  servers: McpServerStatus[];
  tools: McpToolDescriptor[];
  isLoading: boolean;
  scopeOptions: readonly { value: McpConfigScope; label: string }[];
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
  draft: McpServerDraft;
  setDraft: React.Dispatch<React.SetStateAction<McpServerDraft>>;
  configText: string;
  setConfigText: React.Dispatch<React.SetStateAction<string>>;
  openNewForm: () => void;
  openEditForm: (server: McpServerStatus) => void;
  handleSaveServer: () => Promise<void>;
  handleToggleServer: (server: McpServerStatus) => Promise<void>;
  handleRetryServer: (server: McpServerStatus) => Promise<void>;
  handleDeleteServer: (server: McpServerStatus) => Promise<void>;
}

export function MCPSettings({
  mcpSupported,
  currentProject,
  servers,
  tools,
  isLoading,
  handleToggleServer,
  openEditForm,
  handleRetryServer,
  handleDeleteServer,
  openNewForm,
}: MCPSettingsProps) {
  return (
    <motion.div
      key="mcp"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="max-w-[700px] space-y-10"
    >
      <div>
        <h2 className="mb-1 text-[20px] font-medium text-zinc-100">MCP Servers</h2>
        <p className="text-[13px] text-zinc-500">
          Manage Model Context Protocol servers for extending agent capabilities.
        </p>
      </div>

      {!mcpSupported ? (
        <MCPUnsupported />
      ) : (
        <>
          <MCPProjectInfo currentProject={currentProject} />
          <MCPToolsList tools={tools} />
          <MCPServerList
            servers={servers}
            isLoading={isLoading}
            onToggle={handleToggleServer}
            onEdit={openEditForm}
            onRetry={handleRetryServer}
            onDelete={handleDeleteServer}
          />
          <MCPAddButton onClick={openNewForm} />
        </>
      )}
    </motion.div>
  );
}

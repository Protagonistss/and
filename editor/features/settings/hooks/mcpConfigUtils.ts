// MCP Config Utils - MCP 配置解析和序列化工具
import type { McpConfigScope, McpServerConfig, McpServerStatus } from "@/services/mcp";
import type { McpServerDraft } from "../tabs/MCPSettings";

export const DEFAULT_JSON_TEMPLATE = `{
  "mcpServers": {
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "~/test.db"]
    }
  }
}`;

/**
 * Parses JSON config text to server draft
 */
export function parseSnippetToServerConfig(
  text: string,
  fallback: Pick<McpServerDraft, "scope" | "enabled">,
): McpServerDraft | null {
  try {
    const parsed = JSON.parse(text) as unknown;

    // Handle array format: { mcpServers: [...] }
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

    // Handle object format: { mcpServers: { "server-id": {...} } }
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

    // Handle direct server config format
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

/**
 * Creates a draft from an existing server status
 */
export function draftFromServer(server: McpServerStatus): McpServerDraft {
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

/**
 * Serializes a draft to JSON config text
 */
export function serializeDraftToConfigText(draft: McpServerDraft): string {
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

/**
 * Gets scope path information
 */
export function getScopePathInfo(
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

/**
 * Creates an empty draft for the given scope
 */
export function createEmptyDraft(scope: McpConfigScope): McpServerDraft {
  return {
    scope,
    id: "",
    name: "",
    enabled: true,
    command: "",
    argsText: "",
    cwd: "",
    envText: "",
  };
}

import { exists, readTextFile } from "@/services/tauri/fs";
import { isTauriEnv } from "@/services/tauri";

export interface BackendEnvFile {
  backendUrl?: string;
}

function isWindowsPath(path: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(path) || path.startsWith("\\\\");
}

function joinPath(base: string, ...parts: string[]): string {
  const sep = isWindowsPath(base) || base.includes("\\") ? "\\" : "/";
  const normalized = [base, ...parts].map((p, idx) => {
    if (idx === 0) return p.replace(/[\\/]+$/, "");
    return p.replace(/^[\\/]+|[\\/]+$/g, "");
  });
  return normalized.filter(Boolean).join(sep);
}

function normalizeBackendUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

async function readEnvJson(path: string): Promise<BackendEnvFile | null> {
  if (!(await exists(path))) {
    return null;
  }

  const content = await readTextFile(path);
  if (!content.trim()) {
    return null;
  }

  const parsed = JSON.parse(content) as unknown;
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  return parsed as BackendEnvFile;
}

export async function resolveBackendUrlOverride(options: {
  userSlateDir?: string | null;
  projectPath?: string | null;
}): Promise<string | null> {
  if (!isTauriEnv) {
    return null;
  }

  const projectEnvPath =
    options.projectPath && options.projectPath.trim()
      ? joinPath(options.projectPath, ".slate", "env.json")
      : null;

  if (projectEnvPath) {
    try {
      const env = await readEnvJson(projectEnvPath);
      const raw = typeof env?.backendUrl === "string" ? env.backendUrl : "";
      if (raw.trim()) {
        return normalizeBackendUrl(raw);
      }
    } catch {
      // ignore and fall back to user scope
    }
  }

  const userSlateDir = options.userSlateDir?.trim();
  const userEnvPath = userSlateDir ? joinPath(userSlateDir, "env.json") : null;

  if (userEnvPath) {
    try {
      const env = await readEnvJson(userEnvPath);
      const raw = typeof env?.backendUrl === "string" ? env.backendUrl : "";
      if (raw.trim()) {
        return normalizeBackendUrl(raw);
      }
    } catch {
      // ignore
    }
  }

  return null;
}


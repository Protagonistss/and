import { getSlateDir } from "@/services/tauri/fs";
import { isTauriEnv } from "@/services/tauri";
import { resolveBackendUrlOverride } from "./env";

export interface BackendDetailResponse {
  detail?: string;
}

const isTauri =
  typeof window !== "undefined" &&
  ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

let backendBaseUrlCache: string | null = null;
let backendUrlOverride: string | null = null;

function computeBackendBaseUrl(): string {
  const envValue =
    typeof import.meta !== "undefined" && typeof import.meta.env.VITE_BACKEND_URL === "string"
      ? import.meta.env.VITE_BACKEND_URL.trim()
      : "";

  const defaultBaseUrl = isTauri ? "http://127.0.0.1:8000/api/v1" : "/api/v1";

  return (backendUrlOverride || envValue || defaultBaseUrl).replace(/\/+$/, "");
}

export async function refreshBackendEnv(options?: { projectPath?: string | null }): Promise<void> {
  if (!isTauriEnv) {
    return;
  }

  const userSlateDir = await getSlateDir();
  backendUrlOverride = await resolveBackendUrlOverride({
    userSlateDir,
    projectPath: options?.projectPath ?? null,
  });

  backendBaseUrlCache = null;
}

export function getBackendBaseUrl(): string {
  if (!backendBaseUrlCache) {
    backendBaseUrlCache = computeBackendBaseUrl();
  }
  return backendBaseUrlCache;
}

export function buildBackendUrl(path: string): string {
  const base = getBackendBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildBackendAbsoluteUrl(path: string): string {
  const url = buildBackendUrl(path);
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost";

  return new URL(url, origin).toString();
}

export function getBackendTargetLabel(): string {
  const base = getBackendBaseUrl();
  if (!base.startsWith("/")) {
    return base;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${base}`;
  }

  return base;
}

export function getBackendNetworkErrorMessage(error: unknown, fallback: string): string {
  const detail =
    error instanceof Error && error.message
      ? error.message
      : typeof error === "string" && error.trim()
        ? error
        : "network error";

  return `${fallback}：无法连接 backend（${getBackendTargetLabel()}）。请确认 backend 已启动，并且 Vite 代理或 VITE_BACKEND_URL 配置正确。原始错误：${detail}`;
}

export function getBackendErrorMessage(status: number, data: unknown, fallback: string): string {
  if (data && typeof data === "object" && typeof (data as BackendDetailResponse).detail === "string") {
    return (data as BackendDetailResponse).detail as string;
  }

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return `${fallback}（HTTP ${status}）`;
}

/**
 * Tauri 文件系统 API 封装
 */

// 检查是否在 Tauri 环境中
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size?: number;
  modified?: number;
}

/**
 * 读取文本文件
 */
export async function readTextFile(path: string): Promise<string> {
  if (!isTauri) {
    throw new Error('File system not available in browser');
  }

  const { readTextFile } = await import('@tauri-apps/plugin-fs');
  return readTextFile(path);
}

/**
 * 写入文本文件
 */
export async function writeTextFile(path: string, content: string): Promise<void> {
  if (!isTauri) {
    throw new Error('File system not available in browser');
  }

  const { writeTextFile } = await import('@tauri-apps/plugin-fs');
  return writeTextFile(path, content);
}

/**
 * 检查文件/目录是否存在
 */
export async function exists(path: string): Promise<boolean> {
  if (!isTauri) {
    return false;
  }

  const { exists } = await import('@tauri-apps/plugin-fs');
  return exists(path);
}

/**
 * 创建目录
 */
export async function createDir(path: string, recursive = false): Promise<void> {
  if (!isTauri) {
    throw new Error('File system not available in browser');
  }

  const { mkdir } = await import('@tauri-apps/plugin-fs');
  return mkdir(path, { recursive });
}

/**
 * 删除文件/目录
 */
export async function remove(path: string, recursive = false): Promise<void> {
  if (!isTauri) {
    throw new Error('File system not available in browser');
  }

  const { remove } = await import('@tauri-apps/plugin-fs');
  return remove(path, { recursive });
}

/**
 * 读取目录内容
 */
export async function readDir(path: string): Promise<FileInfo[]> {
  if (!isTauri) {
    return [];
  }

  const { readDir } = await import('@tauri-apps/plugin-fs');
  const entries = await readDir(path);

  return entries.map((entry) => ({
    name: entry.name || '',
    path: path + '/' + (entry.name || ''),
    isDirectory: entry.isDirectory,
    isFile: entry.isFile,
  }));
}

/**
 * 获取用户主目录
 */
export async function getHomeDir(): Promise<string | null> {
  if (!isTauri) {
    return null;
  }
  // 浏览器环境没有 homeDir
  return null;
}

/**
 * 获取文档目录
 */
export async function getDocumentDir(): Promise<string | null> {
  if (!isTauri) {
    return null;
  }
  // 浏览器环境没有 documentDir
  return null;
}

/**
 * 路径处理工具
 */

/**
 * 规范化路径（统一使用正斜杠）
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * 获取文件名（不含扩展名）
 */
export function getFileName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  const fullName = parts[parts.length - 1] || '';
  return fullName.replace(/\.[^.]+$/, '');
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  const fullName = parts[parts.length - 1] || '';
  const dotIndex = fullName.lastIndexOf('.');
  return dotIndex > 0 ? fullName.slice(dotIndex + 1).toLowerCase() : '';
}

/**
 * 获取文件完整名称（含扩展名）
 */
export function getFileFullName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * 获取父目录路径
 */
export function getParentDirectory(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  parts.pop();
  return parts.join('/');
}

/**
 * 连接路径
 */
export function joinPath(...parts: string[]): string {
  return parts
    .map((part, index) => {
      if (index === 0) {
        return normalizePath(part).replace(/\/+$/, '');
      }
      return normalizePath(part).replace(/^\/+|\/+$/g, '');
    })
    .filter(Boolean)
    .join('/');
}

/**
 * 根据文件扩展名获取语言
 */
export function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    java: 'java',
    go: 'go',
    rs: 'rust',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    php: 'php',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    vue: 'vue',
    svelte: 'svelte',
  };

  return languageMap[extension.toLowerCase()] || 'plaintext';
}

/**
 * 检查是否为绝对路径
 */
export function isAbsolutePath(path: string): boolean {
  // Windows: 以盘符开头或 UNC 路径
  if (/^[a-zA-Z]:/.test(path) || path.startsWith('\\\\')) {
    return true;
  }
  // Unix: 以 / 开头
  return path.startsWith('/');
}

/**
 * 获取相对路径
 */
export function getRelativePath(from: string, to: string): string {
  const fromParts = normalizePath(from).split('/');
  const toParts = normalizePath(to).split('/');

  // 找到公共前缀
  let commonLength = 0;
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    if (fromParts[i] === toParts[i]) {
      commonLength++;
    } else {
      break;
    }
  }

  // 构建相对路径
  const upLevels = fromParts.length - commonLength - 1;
  const downPath = toParts.slice(commonLength).join('/');

  const relativeParts = [];
  for (let i = 0; i < upLevels; i++) {
    relativeParts.push('..');
  }
  if (downPath) {
    relativeParts.push(downPath);
  }

  return relativeParts.join('/') || '.';
}

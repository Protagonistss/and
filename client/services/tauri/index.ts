export * from './fs';
export * from './shell';
export * from './http';
export * from './store';

// 检查是否在 Tauri 环境中
export const isTauriEnv = typeof window !== 'undefined' && '__TAURI__' in window;

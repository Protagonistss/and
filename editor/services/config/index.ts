import { invoke } from '@tauri-apps/api/core';
import * as types from './types';

export async function getConfig(): Promise<{
  settings: types.Settings;
  config: types.Config;
  mcp: types.MCPConfig;
}> {
  return invoke('get_config');
}

export async function updateSettings(settings: types.Settings): Promise<void> {
  return invoke('update_settings', { settings });
}

export async function getConfigPath(): Promise<string> {
  return invoke('get_config_path');
}

export async function openConfigFolder(): Promise<void> {
  return invoke('open_config_folder');
}

export * from './types';

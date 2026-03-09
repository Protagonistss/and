use crate::config::ConfigManager;
use tauri::{AppHandle, State};
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub async fn get_config(
    manager: State<'_, ConfigManager>,
) -> Result<crate::config::MergedConfig, String> {
    manager.get_merged_config()
}

#[tauri::command]
pub async fn update_settings(
    manager: State<'_, ConfigManager>,
    settings: crate::config::Settings,
) -> Result<(), String> {
    manager.save_settings(&settings)
}

#[tauri::command]
pub async fn get_config_path(
    manager: State<'_, ConfigManager>,
) -> Result<String, String> {
    Ok(manager.get_config_dir().to_string_lossy().to_string())
}

#[tauri::command]
pub async fn open_config_folder(app: AppHandle) -> Result<(), String> {
    let config_dir = dirs::home_dir()
        .ok_or("Cannot find home directory")?
        .join(".slate");
    app.shell()
        .open(config_dir.to_string_lossy().to_string(), None)
        .map_err(|e| format!("Failed to open: {}", e))?;
    Ok(())
}

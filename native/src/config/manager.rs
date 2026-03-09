use super::types::*;
use std::path::{Path, PathBuf};
use std::fs;
use dirs::home_dir;

pub struct ConfigManager {
    user_config_dir: PathBuf,
    project_config_dir: Option<PathBuf>,
}

impl ConfigManager {
    pub fn new() -> Result<Self, String> {
        let user_config_dir = home_dir()
            .ok_or("Cannot find home directory")?
            .join(".slate");

        // 创建用户配置目录
        fs::create_dir_all(&user_config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;

        // 创建默认配置文件（如果不存在）
        Self::create_default_configs(&user_config_dir)?;

        Ok(Self {
            user_config_dir,
            project_config_dir: None,
        })
    }

    pub fn set_project_dir(&mut self, path: &Path) {
        // 只记录项目配置目录路径，不主动创建
        // 项目配置文件仅在用户手动添加时才创建
        self.project_config_dir = Some(path.join(".slate"));
    }

    fn create_default_configs(dir: &PathBuf) -> Result<(), String> {
        // settings.json - 首次启动时创建
        let settings_path = dir.join("settings.json");
        if !settings_path.exists() {
            let default_settings = Settings::default();
            let content = serde_json::to_string_pretty(&default_settings)
                .map_err(|e| format!("Failed to serialize settings: {}", e))?;
            fs::write(&settings_path, content)
                .map_err(|e| format!("Failed to write settings: {}", e))?;
        }

        // config.json - 首次启动时创建
        let config_path = dir.join("config.json");
        if !config_path.exists() {
            let default_config = Config::default();
            let content = serde_json::to_string_pretty(&default_config)
                .map_err(|e| format!("Failed to serialize config: {}", e))?;
            fs::write(&config_path, content)
                .map_err(|e| format!("Failed to write config: {}", e))?;
        }

        // mcp.json - 按需创建，不在首次启动时创建

        Ok(())
    }

    pub fn get_merged_config(&self) -> Result<MergedConfig, String> {
        // 读取用户配置
        let settings: Settings = self.read_json("settings.json")?;
        let config: Config = self.read_json("config.json")?;

        // mcp.json 按需读取，如果不存在则返回空配置
        let mcp: MCPConfig = self.read_json_optional("mcp.json")?;

        // TODO: 如果有项目配置，合并配置

        Ok(MergedConfig {
            settings,
            config,
            mcp,
        })
    }

    fn read_json_optional<T>(&self, filename: &str) -> Result<T, String>
    where
        T: for<'de> serde::Deserialize<'de> + Default,
    {
        let path = self.user_config_dir.join(filename);
        if !path.exists() {
            return Ok(T::default());
        }
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read {}: {}", filename, e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse {}: {}", filename, e))
    }

    fn read_json<T>(&self, filename: &str) -> Result<T, String>
    where
        T: for<'de> serde::Deserialize<'de>,
    {
        let path = self.user_config_dir.join(filename);
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read {}: {}", filename, e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse {}: {}", filename, e))
    }

    pub fn save_settings(&self, settings: &Settings) -> Result<(), String> {
        let path = self.user_config_dir.join("settings.json");
        let content = serde_json::to_string_pretty(settings)
            .map_err(|e| format!("Failed to serialize: {}", e))?;
        fs::write(&path, content)
            .map_err(|e| format!("Failed to write: {}", e))?;
        Ok(())
    }

    pub fn get_config_dir(&self) -> &PathBuf {
        &self.user_config_dir
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct MergedConfig {
    pub settings: Settings,
    pub config: Config,
    pub mcp: MCPConfig,
}

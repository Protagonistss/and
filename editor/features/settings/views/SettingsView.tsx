import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { AnimatePresence } from "motion/react";
import { Cpu, Plug, Settings2, Palette, Keyboard, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GeneralSettings,
  MCPSettings,
  AccountSettings,
  AppearanceSettings,
  ShortcutsSettings,
} from "@/features/settings/tabs";
import { AIModelsSettings } from "@/features/settings/components/AIModelsSettings";
import { useSettingsMcp } from "@/features/settings/hooks/useSettingsMcp";
import { useSettingsAuth } from "@/features/settings/hooks/useSettingsAuth";

const NAV_ITEMS = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "models", label: "AI Models", icon: Cpu },
  { id: "mcp", label: "MCP Servers", icon: Plug },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
  { id: "account", label: "Account", icon: User },
];

export function SettingsView() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("models");

  // Hooks must be called at the top level, not inside conditional/switch
  const mcpProps = useSettingsMcp();
  const authProps = useSettingsAuth();

  useEffect(() => {
    if (location.hash) {
      const tabId = location.hash.replace("#", "");
      if (NAV_ITEMS.some((item) => item.id === tabId)) {
        setActiveTab(tabId);
      }
    }
  }, [location.hash]);

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings key="general" />;
      case "models":
        return <AIModelsSettings key="models" />;
      case "mcp":
        return <MCPSettings key="mcp" {...mcpProps} />;
      case "appearance":
        return <AppearanceSettings key="appearance" />;
      case "shortcuts":
        return <ShortcutsSettings key="shortcuts" />;
      case "account":
        return (
          <AccountSettings
            key="account"
            user={authProps.user}
            currentOAuthProvider={authProps.currentOAuthProvider}
            pendingAction={authProps.pendingAction}
            pendingOAuthProvider={authProps.pendingOAuthProvider}
            backendBaseUrl={authProps.backendBaseUrl}
            onConnect={authProps.handleOAuthSignIn}
            onSignOut={authProps.handleSignOut}
            onDeleteAccount={authProps.handleDeleteAccount}
          />
        );
      default:
        return <GeneralSettings key="general" />;
    }
  };

  return (
    <div className="flex h-full w-full bg-obsidian text-zinc-100 overflow-hidden">
      {/* Left Navigation Sidebar */}
      <div className="w-[260px] flex-shrink-0 border-r border-graphite bg-charcoal/30 flex flex-col">
        <div className="h-14 flex items-center px-6 border-b border-graphite">
          <h2 className="text-[14px] font-medium text-zinc-200">Settings</h2>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 outline-none relative",
                    isActive
                      ? "bg-white/10 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  )}
                >
                  <Icon
                    size={16}
                    className={cn("transition-colors", isActive ? "text-zinc-200" : "text-zinc-500")}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-obsidian/50 relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black">
          <div className="max-w-[720px] w-full px-8 py-10 lg:px-16 lg:py-16">
            <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

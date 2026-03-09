import { useLocation, useNavigate } from "react-router";
import {
  PencilLine,
  Bot,
  Settings,
  Share2,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo, SimpleLogo } from "../shared";

interface TopBarProps {
  onToggleRightSidebar?: () => void;
  rightSidebarOpen?: boolean;
}

export function TopBar({ onToggleRightSidebar, rightSidebarOpen = false }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditor = location.pathname === "/editor";
  const isAgent = location.pathname === "/agent";
  const isHome = location.pathname === "/";

  return (
    <header className="h-14 border-b border-graphite flex items-center justify-between px-4 z-50 bg-obsidian/50 backdrop-blur-md">
      {/* Left section: Logo */}
      <div className="flex items-center gap-4 w-1/3">
        <Logo />
      </div>

      {/* Middle section: Mode Switcher */}
      <div className="flex-1 flex justify-center">
        {!isHome && (
          <div className="slate-glass p-1 rounded-full flex items-center gap-1">
            <ModeButton
              isActive={isEditor}
              icon={PencilLine}
              label="Editor"
              onClick={() => navigate("/editor")}
            />
            <ModeButton
              isActive={isAgent}
              icon={Bot}
              label="Agent"
              onClick={() => navigate("/agent")}
            />
          </div>
        )}
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-3 w-1/3 justify-end">
        {onToggleRightSidebar && (
          <button
            onClick={onToggleRightSidebar}
            className={cn(
              "p-2 rounded-md transition-all",
              rightSidebarOpen ? "bg-zinc-800 text-zinc-100" : "hover:bg-zinc-800 text-zinc-500"
            )}
          >
            <History size={18} />
          </button>
        )}
        <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
          <Share2 size={18} />
        </button>
        <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
          <Settings size={18} />
        </button>
        <div className="h-4 w-px bg-graphite" />
        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
          <SimpleLogo size={20} />
        </div>
      </div>
    </header>
  );
}

interface ModeButtonProps {
  isActive: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
}

function ModeButton({ isActive, icon: Icon, label, onClick }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
        isActive
          ? "bg-zinc-100 text-obsidian shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      )}
    >
      <Icon size={14} className={isActive ? "text-obsidian" : ""} />
      <span>{label}</span>
    </button>
  );
}

export type { TopBarProps };

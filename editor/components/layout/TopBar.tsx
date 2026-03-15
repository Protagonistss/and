import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  PencilLine,
  Bot,
  Settings,
  Share2,
  History,
  User,
  Minus,
  Square,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "../shared";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAuthStore } from "@/stores";

interface TopBarProps {
  onToggleRightSidebar?: () => void;
  rightSidebarOpen?: boolean;
}

export function TopBar({ onToggleRightSidebar, rightSidebarOpen = false }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const isEditor = location.pathname === "/editor";
  const isAgent = location.pathname === "/agent";
  const isHome = location.pathname === "/";

  // 窗口控制函数
  const handleMinimize = () => {
    getCurrentWindow().minimize();
  };

  const handleMaximize = () => {
    getCurrentWindow().toggleMaximize();
  };

  const handleClose = () => {
    getCurrentWindow().close();
  };

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只在非按钮区域拖动，排除所有 button 和 a 元素
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) return;
    getCurrentWindow().startDragging();
  };

  const userInitial = authUser?.username.trim().charAt(0).toUpperCase() || "";
  const showAvatarImage = Boolean(authUser?.avatarUrl && !avatarFailed);

  useEffect(() => {
    setAvatarFailed(false);
  }, [authUser?.avatarUrl]);

  return (
    <header
      className="h-12 border-b border-graphite flex items-center justify-between px-3 z-50 bg-obsidian/50 backdrop-blur-md"
      onMouseDown={handleMouseDown}
      data-tauri-drag-region
    >
      {/* Left section: Logo */}
      <div className="flex items-center gap-4 w-1/3" data-tauri-drag-region>
        <Logo />
      </div>

      {/* Middle section: Mode Switcher */}
      <div className="flex-1 flex justify-center scale-95 origin-center" data-tauri-drag-region>
        {!isHome && (
          <div className="slate-glass p-0.5 rounded-full flex items-center gap-0.5">
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
      <div
        className="flex items-center w-1/3 justify-end"
        style={{ pointerEvents: "none" }}
      >
        <div className="flex items-center gap-1.5 pr-1" style={{ pointerEvents: "auto" }}>
          {onToggleRightSidebar && (
            <button
              onClick={onToggleRightSidebar}
              className={cn(
                "p-1.5 rounded-md transition-all",
                rightSidebarOpen ? "bg-zinc-800 text-zinc-100" : "hover:bg-zinc-800 text-zinc-500"
              )}
            >
              <History size={16} />
            </button>
          )}
          <button className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            <Share2 size={16} />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              location.pathname === "/settings"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            )}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <div className="h-3.5 w-px bg-graphite" />
          <div
            onClick={() => navigate("/settings?tab=account")}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-7 w-7 ml-1 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center hover:bg-zinc-700 hover:border-zinc-600 transition-all cursor-pointer select-none"
            title={authUser ? "打开账号设置" : "登录与账号设置"}
          >
            {showAvatarImage ? (
              <img
                src={authUser?.avatarUrl ?? ""}
                alt={authUser?.username || "User avatar"}
                className="h-full w-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : authUser ? (
              <span className="text-[12px] font-semibold text-zinc-100">{userInitial}</span>
            ) : (
              <User size={14} className="text-zinc-300" />
            )}
          </div>

          {/* Window Controls */}
          <div className="flex items-center -mr-1">
            <button
              onClick={handleMinimize}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors rounded-tl-md rounded-bl-md"
              title="最小化"
            >
              <Minus size={12} strokeWidth={2} />
            </button>
            <button
              onClick={handleMaximize}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="最大化"
            >
              <Square size={11} strokeWidth={2} />
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-red-600 transition-colors rounded-tr-md rounded-br-md"
              title="关闭"
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

interface ModeButtonProps {
  isActive: boolean;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
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

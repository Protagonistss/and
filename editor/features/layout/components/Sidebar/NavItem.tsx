// NavItem - 导航项组件
import { cn } from "@/lib/utils";

export interface NavItemProps {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function NavItem({ icon: Icon, label, active = false, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all",
        active ? "bg-zinc-800/80 text-zinc-100" : "text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300"
      )}
    >
      <Icon size={16} />
      <span>{label}</span>
    </div>
  );
}

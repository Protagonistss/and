import { FolderOpen, Download, TerminalSquare } from "lucide-react";
import type { ProjectRecord } from "@/services/config";

interface WelcomeScreenProps {
  recentProjects: ProjectRecord[];
  onOpenProject: () => void;
  onOpenProjectByPath: (path: string) => void;
}

export function WelcomeScreen({ recentProjects, onOpenProject, onOpenProjectByPath }: WelcomeScreenProps) {
  return (
    <div className="max-w-[640px] w-full px-8 pb-32 relative z-10">
      {/* Logo & Settings Row */}
      <div className="flex flex-col items-center mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-[34px] h-[34px] rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-800/80 flex items-center justify-center border border-zinc-600/50 shadow-sm overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
            <div className="flex gap-[2px] rotate-[15deg]">
              <div className="w-[3.5px] h-[14px] bg-zinc-100 rounded-[1.5px]" />
              <div className="w-[3.5px] h-[14px] bg-zinc-500 rounded-[1.5px] translate-y-[4px]" />
            </div>
          </div>
          <span className="text-[28px] font-bold text-zinc-100 tracking-wider">SLATE</span>
        </div>

        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-fog-blue hover:text-fog-blue/80 cursor-pointer transition-colors">Settings</span>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <button
          onClick={onOpenProject}
          className="flex flex-col gap-4 p-5 rounded-xl bg-charcoal hover:bg-[#1a1c23] border border-graphite hover:border-zinc-700/60 transition-all text-left group shadow-sm"
        >
          <FolderOpen size={22} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          <span className="text-[13px] font-medium text-zinc-300 group-hover:text-zinc-100">Open project</span>
        </button>
        <button
          onClick={() => {}}
          className="flex flex-col gap-4 p-5 rounded-xl bg-charcoal hover:bg-[#1a1c23] border border-graphite hover:border-zinc-700/60 transition-all text-left group shadow-sm opacity-50 cursor-not-allowed"
        >
          <Download size={22} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          <span className="text-[13px] font-medium text-zinc-300 group-hover:text-zinc-100">Clone repo</span>
        </button>
        <button
          onClick={() => {}}
          className="flex flex-col gap-4 p-5 rounded-xl bg-charcoal hover:bg-[#1a1c23] border border-graphite hover:border-zinc-700/60 transition-all text-left group shadow-sm opacity-50 cursor-not-allowed"
        >
          <TerminalSquare size={22} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          <span className="text-[13px] font-medium text-zinc-300 group-hover:text-zinc-100">Connect via SSH</span>
        </button>
      </div>

      {/* Recent Projects */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-[12px] text-zinc-500 font-medium">Recent projects</span>
          <button className="text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors">View all</button>
        </div>

        <div className="flex flex-col">
          {recentProjects.length > 0 ? recentProjects.slice(0, 5).map((project, idx) => (
            <button
              key={idx}
              onClick={() => onOpenProjectByPath(project.path)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-charcoal/80 transition-colors group text-left border border-transparent hover:border-graphite/50"
            >
              <span className="text-[13px] text-zinc-300 group-hover:text-zinc-100 transition-colors truncate mr-4">
                {project.name}
              </span>
              <span className="text-[12px] text-zinc-500 group-hover:text-zinc-400 transition-colors truncate max-w-[60%] font-mono" title={project.path}>
                {project.path}
              </span>
            </button>
          )) : (
            <div className="text-[13px] text-zinc-500 px-3 py-2 italic">No recent projects</div>
          )}
        </div>
      </div>
    </div>
  );
}

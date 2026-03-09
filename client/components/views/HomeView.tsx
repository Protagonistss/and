import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  PencilLine,
  Bot,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function HomeView() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-between h-full w-full relative overflow-hidden px-6 py-24">

      {/* Subtle ambient light to break the pure black void */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-graphite/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Top spacing element for better visual balance */}
      <div className="flex-1" />

      <div className="max-w-[720px] w-full flex flex-col justify-center space-y-16 relative z-10">
        {/* Header section */}
        <section className="text-center">
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-[32px] font-medium tracking-tight text-zinc-200"
            >
              Start a new session
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-[15px] text-zinc-500 max-w-[480px] mx-auto leading-relaxed"
            >
              Choose how you want to work today. Let AI assist you in the editor, or assign an autonomous agent for complex tasks.
            </motion.p>
          </div>
        </section>

        {/* Primary Actions Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ActionCard
            icon={PencilLine}
            title="New Project"
            desc="An immersive coding environment where you build, and AI assists. Perfect for deep focus and manual control."
            onClick={() => navigate("/editor")}
            variant="editor"
            delay={0.3}
          />
          <ActionCard
            icon={Bot}
            title="New Agent"
            desc="Set a goal and let the AI autonomously plan, execute, and deliver results. You review and approve."
            onClick={() => navigate("/agent")}
            variant="agent"
            delay={0.4}
          />
        </section>
      </div>

      {/* Bottom spacing element */}
      <div className="flex-[1.5]" />
    </div>
  );
}

interface ActionCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  onClick: () => void;
  variant: 'editor' | 'agent';
  delay: number;
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  onClick,
  variant,
  delay
}: ActionCardProps) {
  const isEditor = variant === 'editor';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        "relative p-8 rounded-2xl border bg-charcoal cursor-pointer transition-all duration-300 group overflow-hidden flex flex-col min-h-[220px]",
        "border-graphite hover:border-zinc-700/60",
        isEditor ? "hover:bg-[#15171c]" : "hover:bg-[#18161b]"
      )}
    >
      {/* Subtle background glow representing mode */}
      <div className={cn(
        "absolute -inset-32 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-700 blur-[80px] rounded-full pointer-events-none",
        isEditor ? "bg-fog-blue" : "bg-dusty-purple"
      )} />

      <div className="relative z-10 flex flex-col h-full">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center border mb-6 transition-transform group-hover:scale-[1.05] duration-300",
          "bg-obsidian border-graphite shadow-sm",
          isEditor ? "group-hover:border-fog-blue/30 text-zinc-400 group-hover:text-fog-blue" : "group-hover:border-dusty-purple/30 text-zinc-400 group-hover:text-dusty-purple"
        )}>
          <Icon size={22} className="stroke-[1.5]" />
        </div>

        <h3 className="text-[17px] font-medium text-zinc-200 mb-2 group-hover:text-zinc-100 transition-colors">{title}</h3>
        <p className="text-[14px] text-zinc-500 leading-relaxed mb-8">{desc}</p>

        <div className={cn(
          "flex items-center gap-1.5 text-[13px] font-medium mt-auto transition-colors",
          "text-zinc-500 group-hover:text-zinc-300"
        )}>
          <span>Start session</span>
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

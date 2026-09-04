"use client";

import React from "react";
import { Bot, Plus, Settings2, Sparkles, Activity } from "lucide-react";

interface NavbarProps {
  onOpenCreateRun: () => void;
  onOpenSupervisors: () => void;
  activeRunsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateRun,
  onOpenSupervisors,
  activeRunsCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              FlowPilot
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Temporal + Gemini
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">Autonomous AI Order Supervisor</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
          <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span>Active Runs: <strong>{activeRunsCount}</strong></span>
        </div>

        <button
          onClick={onOpenSupervisors}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span>Templates</span>
        </button>

        <button
          onClick={onOpenCreateRun}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Order Run</span>
        </button>
      </div>
    </header>
  );
};

"use client";

import React from "react";
import {
  Layers,
  Plus,
  SlidersHorizontal,
  Activity,
  ChevronRight,
  ShieldCheck,
  Boxes,
} from "lucide-react";

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
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40 px-5 py-3 flex items-center justify-between text-slate-900 shadow-xs">
      {/* Brand & Workspace Context */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm text-white">
          <Boxes className="h-4.5 w-4.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-slate-900">FlowPilot</span>
          <span className="text-slate-300 font-light">/</span>
          <span className="text-xs font-medium text-slate-600">Operations Control</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ml-1">
            Enterprise
          </span>
        </div>
      </div>

      {/* Right Controls: Active Counter, Templates, New Order Run */}
      <div className="flex items-center gap-2.5">
        {/* Active Runs Count Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-500 font-medium">Active Runs:</span>
          <span className="font-semibold text-slate-900">{activeRunsCount}</span>
        </div>

        {/* Supervisor Policies / Templates */}
        <button
          onClick={onOpenSupervisors}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 hover:border-slate-300 shadow-xs transition"
          title="Configure supervisor policies and templates"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <span>Policies & Templates</span>
        </button>

        {/* Primary CTA */}
        <button
          onClick={onOpenCreateRun}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Order Run</span>
        </button>
      </div>
    </header>
  );
};

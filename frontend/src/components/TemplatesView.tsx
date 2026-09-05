"use client";

import React from "react";
import {
  SlidersHorizontal,
  Plus,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  Bot,
  Package,
} from "lucide-react";
import { Supervisor } from "../lib/types";

interface TemplatesViewProps {
  supervisors: Supervisor[];
  onOpenCreateSupervisor: () => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  supervisors,
  onOpenCreateSupervisor,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-900 p-5 lg:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Supervisor Archetypes & Templates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure autonomous AI supervisor behaviors, wake schedules, escalation policies, and allowable business actions.
          </p>
        </div>

        <button
          onClick={onOpenCreateSupervisor}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Custom Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {supervisors.map((sup) => (
          <div
            key={sup.id}
            className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4 hover:border-slate-300 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{sup.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400 capitalize">{sup.aggressiveness} Mode</span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Active
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
              {sup.description || sup.base_instruction || "Monitors order lifecycle events, evaluates fulfillment exceptions, and executes automated business actions."}
            </p>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400 text-[11px]">Wake Interval:</span>
                <span className="font-mono font-semibold text-slate-800">{sup.default_wakeup_interval_seconds / 60} minutes</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400 text-[11px]">Aggressiveness:</span>
                <span className="capitalize font-semibold text-slate-800">{sup.aggressiveness}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400 text-[11px]">AI Model:</span>
                <span className="font-mono font-semibold text-slate-800">Gemini 2.5 Pro (Autonomous)</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Allowed Actions
              </span>
              <div className="flex flex-wrap gap-1">
                {(sup.allowed_tools || ["message_fulfillment_team", "message_logistics_team", "message_customer"]).map((tool) => (
                  <span
                    key={tool}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

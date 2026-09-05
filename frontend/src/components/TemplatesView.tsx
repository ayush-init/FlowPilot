"use client";

import React from "react";
import {
  Plus,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  Radio,
  FileCode2,
} from "lucide-react";
import { Supervisor } from "../lib/types";

interface TemplatesViewProps {
  supervisors: Supervisor[];
  onOpenCreateSupervisor: () => void;
  onSelectTemplateForRun?: (supervisorId: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  supervisors,
  onOpenCreateSupervisor,
  onSelectTemplateForRun,
}) => {
  const getArchetypeConfig = (name: string, aggressiveness: string) => {
    if (aggressiveness === "high" || name.toLowerCase().includes("vip")) {
      return {
        icon: <Zap className="h-5 w-5 text-amber-600" />,
        iconBg: "bg-amber-50 border-amber-200/70",
        badge: "High Sensitivity",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        posture: "Aggressive Escalation",
      };
    }
    if (aggressiveness === "low" || name.toLowerCase().includes("silent")) {
      return {
        icon: <Clock className="h-5 w-5 text-slate-600" />,
        iconBg: "bg-slate-100 border-slate-200",
        badge: "Exception Only",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
        posture: "Critical Exceptions Only",
      };
    }
    return {
      icon: <ShieldCheck className="h-5 w-5 text-indigo-600" />,
      iconBg: "bg-indigo-50 border-indigo-200/70",
      badge: "Balanced Guardian",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      posture: "Balanced Autonomous",
    };
  };

  const formatInterval = (seconds: number) => {
    if (seconds >= 3600) {
      const hours = seconds / 3600;
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    return `${Math.round(seconds / 60)} minutes`;
  };

  const cleanActionLabel = (action: string) => {
    return action
      .replace(/^message_/, "")
      .replace(/^create_/, "")
      .replace(/_/g, " ");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-900 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Supervisor Archetypes & Templates
            </h1>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 border border-slate-300/60">
              {supervisors.length} Archetypes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure autonomous AI supervisor behaviors, wake schedules, escalation policies, and allowable business actions.
          </p>
        </div>

        <button
          onClick={onOpenCreateSupervisor}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Custom Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {supervisors.map((sup) => {
          const config = getArchetypeConfig(sup.name, sup.aggressiveness);
          const actions = sup.allowed_tools && sup.allowed_tools.length > 0
            ? sup.allowed_tools
            : [
                "message_fulfillment_team",
                "message_logistics_team",
                "message_customer",
                "create_internal_note"
              ];

          return (
            <div
              key={sup.id}
              className="group flex flex-col justify-between p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-4">
                {/* Top Row: Icon + Title + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${config.iconBg} shadow-2xs`}>
                      {config.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {sup.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${config.badgeColor}`}>
                          {config.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>

                {/* Policy Directive / Description */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {sup.description || sup.base_instruction || "Monitors order lifecycle events, evaluates fulfillment exceptions, and executes automated business actions."}
                  </p>
                </div>

                {/* Telemetry Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Wake Interval</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {formatInterval(sup.default_wakeup_interval_seconds)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Radio className="h-3 w-3 text-slate-500" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Posture</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 capitalize truncate block">
                      {sup.aggressiveness}
                    </span>
                  </div>
                </div>

                {/* Allowed Business Actions */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Authorized Actions
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {actions.length} Tools
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {actions.map((tool) => (
                      <span
                        key={tool}
                        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs"
                        title={tool}
                      >
                        <span className="h-1 w-1 rounded-full bg-slate-400" />
                        {cleanActionLabel(tool)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Deterministic Policy
                </span>
                <span className="text-[11px] font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                  Ready to deploy
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

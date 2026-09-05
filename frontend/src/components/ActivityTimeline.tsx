"use client";

import React, { useState } from "react";
import {
  Activity,
  Zap,
  Wrench,
  UserCheck,
  Award,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Clock,
  Bot,
} from "lucide-react";
import { RunActivity, ActivityType } from "../lib/types";

interface ActivityTimelineProps {
  activities: RunActivity[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState<string>("all");

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getActivityConfig = (type: ActivityType | string, title: string) => {
    switch (type) {
      case "TOOL_ACTION":
        return {
          icon: <Wrench className="h-3.5 w-3.5 text-amber-600" />,
          badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
          borderHover: "hover:border-amber-300",
          label: "BUSINESS ACTION",
        };
      case "AGENT_REASONING":
        return {
          icon: <Bot className="h-3.5 w-3.5 text-indigo-600" />,
          badgeBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
          borderHover: "hover:border-indigo-300",
          label: "POLICY DECISION",
        };
      case "WAKE_DECISION":
        return {
          icon: <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />,
          badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
          borderHover: "hover:border-blue-300",
          label: "SUPERVISOR WAKE",
        };
      case "SIGNAL_RECEIVED":
        return {
          icon: <Zap className="h-3.5 w-3.5 text-slate-700" />,
          badgeBg: "bg-slate-100 text-slate-800 border-slate-200",
          borderHover: "hover:border-slate-300",
          label: "SIGNAL INJECTED",
        };
      case "INSTRUCTION_ADDED":
        return {
          icon: <UserCheck className="h-3.5 w-3.5 text-teal-600" />,
          badgeBg: "bg-teal-50 text-teal-800 border-teal-200",
          borderHover: "hover:border-teal-300",
          label: "OPERATOR GUIDANCE",
        };
      case "FINAL_RETROSPECTIVE":
        return {
          icon: <Award className="h-3.5 w-3.5 text-emerald-600" />,
          badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          borderHover: "hover:border-emerald-300",
          label: "WORKFLOW COMPLETED",
        };
      case "WORKFLOW_STATE_CHANGE":
      default:
        return {
          icon: <Clock className="h-3.5 w-3.5 text-slate-500" />,
          badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
          borderHover: "hover:border-slate-300",
          label: "STATE / MEMORY UPDATE",
        };
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filterType === "all") return true;
    if (filterType === "tools") return act.activity_type === "TOOL_ACTION";
    if (filterType === "ai") return act.activity_type === "AGENT_REASONING" || act.activity_type === "WAKE_DECISION";
    if (filterType === "signals")
      return (
        act.activity_type === "SIGNAL_RECEIVED" ||
        act.activity_type === "INSTRUCTION_ADDED" ||
        act.activity_type === "WORKFLOW_STATE_CHANGE" ||
        act.activity_type.includes("SIGNAL") ||
        act.activity_type.includes("EVENT")
      );
    return true;
  });

  if (!activities || activities.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
        <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2 animate-spin" />
        <p className="text-xs text-slate-600 font-medium">Waiting for workflow signals and supervisor activity...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          {[
            { id: "all", label: "All Events" },
            { id: "ai", label: "Decisions" },
            { id: "tools", label: "Actions" },
            { id: "signals", label: "Signals" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition ${
                filterType === tab.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Showing {filteredActivities.length} items
        </span>
      </div>

      {/* Activity Timeline Stream */}
      <div className="space-y-2.5">
        {filteredActivities.map((act) => {
          const config = getActivityConfig(act.activity_type, act.title);
          const isExpanded = expandedIds[act.id];
          const hasMetadata = act.metadata_json && Object.keys(act.metadata_json).length > 0;

          return (
            <div
              key={act.id}
              className={`p-3.5 rounded-xl border border-slate-200 bg-white transition-all shadow-xs ${config.borderHover}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="p-1 rounded bg-slate-50 border border-slate-200">
                    {config.icon}
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeBg}`}
                  >
                    {config.label}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{act.title}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                  {new Date(act.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>

              {/* Clean Summary Content */}
              <p className="text-xs text-slate-700 leading-relaxed pl-7 whitespace-pre-wrap font-sans">
                {act.content}
              </p>

              {/* Expandable JSON Payload Drawer */}
              {hasMetadata && (
                <div className="pl-7 pt-1.5">
                  <button
                    onClick={() => toggleExpand(act.id)}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-600 font-mono transition"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <span>{isExpanded ? "Hide Payload Data" : "Inspect Payload JSON"}</span>
                  </button>
                  {isExpanded && (
                    <pre className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto">
                      {JSON.stringify(act.metadata_json, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

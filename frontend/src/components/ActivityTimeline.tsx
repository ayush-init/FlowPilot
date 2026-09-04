"use client";

import React, { useState } from "react";
import {
  Activity,
  Zap,
  Wrench,
  Brain,
  UserCheck,
  RefreshCw,
  Award,
  ChevronDown,
  ChevronRight,
  Shield,
  Clock,
} from "lucide-react";
import { RunActivity } from "../lib/types";

interface ActivityTimelineProps {
  activities: RunActivity[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getActivityConfig = (type: string) => {
    switch (type) {
      case "TOOL_ACTION":
        return {
          icon: <Wrench className="h-4 w-4 text-emerald-400" />,
          badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          cardBg: "bg-slate-900/60 border-emerald-500/20",
          label: "Business Action Executed",
        };
      case "AGENT_REASONING":
        return {
          icon: <Brain className="h-4 w-4 text-violet-400" />,
          badgeBg: "bg-violet-500/15 text-violet-300 border-violet-500/30",
          cardBg: "bg-slate-900/60 border-violet-500/20",
          label: "Agent Reasoning",
        };
      case "WAKE_DECISION":
        return {
          icon: <Shield className="h-4 w-4 text-amber-400" />,
          badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          cardBg: "bg-slate-900/60 border-amber-500/20",
          label: "Classifier Filter",
        };
      case "SIGNAL_RECEIVED":
        return {
          icon: <Zap className="h-4 w-4 text-indigo-400" />,
          badgeBg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
          cardBg: "bg-slate-900/60 border-indigo-500/20",
          label: "Signal Received",
        };
      case "INSTRUCTION_ADDED":
        return {
          icon: <UserCheck className="h-4 w-4 text-cyan-400" />,
          badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
          cardBg: "bg-slate-900/60 border-cyan-500/20",
          label: "Human Guidance",
        };
      case "FINAL_RETROSPECTIVE":
        return {
          icon: <Award className="h-4 w-4 text-amber-300" />,
          badgeBg: "bg-amber-500/20 text-amber-200 border-amber-500/40",
          cardBg: "bg-slate-900/80 border-amber-500/40",
          label: "Final Retrospective",
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 text-slate-400" />,
          badgeBg: "bg-slate-800 text-slate-400 border-slate-700",
          cardBg: "bg-slate-900/60 border-slate-800",
          label: "State Update",
        };
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
        <Activity className="h-8 w-8 text-slate-600 mx-auto mb-2 animate-spin" />
        <p className="text-xs text-slate-400">Waiting for workflow events and supervisor actions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((act) => {
        const config = getActivityConfig(act.activity_type);
        const isExpanded = expandedIds[act.id];
        const hasMetadata = act.metadata_json && Object.keys(act.metadata_json).length > 0;

        return (
          <div
            key={act.id}
            className={`p-4 rounded-xl border transition shadow-sm ${config.cardBg}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  {config.icon}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeBg}`}
                >
                  {config.label}
                </span>
                <span className="text-xs font-semibold text-white">{act.title}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                {new Date(act.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pl-8 mb-1 whitespace-pre-wrap">
              {act.content}
            </p>

            {hasMetadata && (
              <div className="pl-8 pt-1">
                <button
                  onClick={() => toggleExpand(act.id)}
                  className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <span>{isExpanded ? "Hide Payload Data" : "View Structured JSON"}</span>
                </button>
                {isExpanded && (
                  <pre className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                    {JSON.stringify(act.metadata_json, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

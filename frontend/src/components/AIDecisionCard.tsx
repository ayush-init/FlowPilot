"use client";

import React from "react";
import {
  Zap,
  ShieldCheck,
  Clock,
  Wrench,
  Bot,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { OrderRun, parseUtcDate } from "../lib/types";

interface AIDecisionCardProps {
  run: OrderRun;
}

export const AIDecisionCard: React.FC<AIDecisionCardProps> = ({ run }) => {
  const activities = run.activities || [];

  const reasoning = activities.find((a) => a.activity_type === "AGENT_REASONING");
  const signal = activities.find((a) => a.activity_type === "SIGNAL_RECEIVED");
  const toolAction = activities.find((a) => a.activity_type === "TOOL_ACTION");
  const wakeDecision = activities.find((a) => a.activity_type === "WAKE_DECISION");

  let trigger = "Routine Scheduled Checkpoint";
  if (signal?.metadata_json?.event_type) {
    trigger = signal.metadata_json.event_type;
  } else if (wakeDecision?.metadata_json?.trigger) {
    trigger = wakeDecision.metadata_json.trigger;
  } else if (reasoning?.metadata_json?.trigger) {
    trigger = reasoning.metadata_json.trigger;
  }

  const hasToolAction = !!toolAction;
  const isCompleted = run.status === "COMPLETED";
  const isTerminated = run.status === "TERMINATED";
  const isPaused = run.status === "PAUSED";

  // AI State
  let aiState = "Sleeping";
  if (run.status === "RUNNING") {
    aiState = hasToolAction ? "Acting" : "Thinking";
  } else if (isCompleted) {
    aiState = "Completed";
  } else if (isTerminated) {
    aiState = "Terminated";
  } else if (isPaused) {
    aiState = "Paused";
  }

  const decisionType = isCompleted
    ? "Complete Workflow"
    : isTerminated
    ? "Workflow Terminated"
    : hasToolAction
    ? "Intervene & Escalate"
    : "Observe & Stand By";

  let reasonText = "";
  if (reasoning?.content) {
    const lines = reasoning.content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("```") && !l.startsWith("{") && !l.startsWith("[") && !l.toLowerCase().includes("system instruction"));
    reasonText = lines.slice(0, 2).join(" ").replace(/[\*\#\_]/g, "");
  }

  if (!reasonText) {
    if (isCompleted) {
      reasonText = "All order milestones fulfilled and verified. Final journey retrospective captured.";
    } else if (hasToolAction) {
      reasonText = "Signal indicates operational exception requiring active department intervention under supervisor instructions.";
    } else {
      reasonText = "Order progress evaluated. No active anomalies detected; resuming durable scheduled monitoring.";
    }
  }

  let actionName = "None (Passive monitoring)";
  if (toolAction) {
    actionName = toolAction.title.replace(/^Action:\s*/, "");
  }

  let nextAction = "Sleep until next scheduled check";
  if (run.next_wakeup_at && run.status === "SLEEPING") {
    nextAction = `Sleeping until ${parseUtcDate(run.next_wakeup_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } else if (isCompleted) {
    nextAction = "Workflow complete. No further wakeups.";
  } else if (isTerminated) {
    nextAction = "Workflow terminated.";
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              AI Supervisor Decision
            </h3>
            <span className="text-[10px] text-slate-500">
              Evaluated by {run.supervisor?.name || "Autonomous Guardian"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
              hasToolAction
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : isCompleted
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            {decisionType}
          </span>
        </div>
      </div>

      {/* Grid of Key Attributes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Trigger */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <Zap className="h-3 w-3 text-indigo-600" />
            <span>Trigger</span>
          </div>
          <p className="text-xs font-mono font-semibold text-slate-900 truncate">{trigger}</p>
        </div>

        {/* AI State */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <Activity className="h-3 w-3 text-emerald-600" />
            <span>AI State</span>
          </div>
          <p className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${run.status === "RUNNING" ? "bg-emerald-500 animate-ping" : "bg-blue-500"}`} />
            {aiState}
          </p>
        </div>

        {/* Action Executed */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <Wrench className="h-3 w-3 text-amber-600" />
            <span>Action</span>
          </div>
          <p className="text-xs font-mono font-medium text-slate-800 truncate">{actionName}</p>
        </div>

        {/* Next State */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <Clock className="h-3 w-3 text-blue-600" />
            <span>Next State</span>
          </div>
          <p className="text-xs font-medium text-slate-700 truncate">{nextAction}</p>
        </div>
      </div>

      {/* Concise Decision Rationale */}
      <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-150 text-xs space-y-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Decision Rationale
        </span>
        <p className="text-slate-700 leading-relaxed font-normal">{reasonText}</p>
      </div>
    </div>
  );
};

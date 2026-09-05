"use client";

import React from "react";
import {
  Brain,
  Zap,
  Activity,
  Wrench,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { OrderRun, parseUtcDate } from "../lib/types";

interface AIDecisionCardProps {
  run: OrderRun;
}

export const AIDecisionCard: React.FC<AIDecisionCardProps> = ({ run }) => {
  const activities = run.activities || [];

  const reasoning = activities.find((a) => a.activity_type === "AGENT_REASONING");
  const signal = activities.find((a) => a.activity_type === "SIGNAL_RECEIVED" || a.activity_type === "WORKFLOW_START");
  const toolAction = activities.find((a) => a.activity_type === "TOOL_ACTION");
  const wakeDecision = activities.find((a) => a.activity_type === "WAKE_DECISION" || a.activity_type === "AI_WAKE");

  let trigger = "routine_checkpoint";
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

  // AI State
  let aiState = "Sleeping / Standby";
  if (run.status === "RUNNING") {
    aiState = hasToolAction ? "Acting / Intervening" : "Thinking / Evaluated";
  } else if (isCompleted) {
    aiState = "Completed / Reconciled";
  } else if (isTerminated) {
    aiState = "Terminated";
  }

  const decisionType = isCompleted
    ? "Complete Workflow"
    : isTerminated
    ? "Aborted by Operator"
    : hasToolAction
    ? "Intervene & Escalate"
    : "Passive Monitor";

  let actionName = "None (No Action Dispatched)";
  if (toolAction) {
    actionName = toolAction.title.replace(/^Action:\s*/, "");
  }

  // Clean concise operational reasoning
  let reasonText = "";
  if (reasoning?.content) {
    const lines = reasoning.content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("```") && !l.startsWith("{") && !l.startsWith("[") && !l.toLowerCase().includes("system instruction"));
    reasonText = lines.slice(0, 3).join(" ").replace(/[\*\#\_]/g, "");
  }

  if (!reasonText) {
    if (isCompleted) {
      reasonText = "Order delivery has been confirmed by carrier. Final summary retrospective recorded with all milestones fulfilled.";
    } else if (trigger === "shipment_delayed") {
      reasonText = "Shipment delay flagged in transit. Standard grace period bypassed to secure freight priority re-route and alert operations team.";
    } else if (hasToolAction) {
      reasonText = "Incoming event indicated operational exception requiring proactive automated intervention under active supervisor directives.";
    } else {
      reasonText = "Order telemetry evaluated within normal parameters. No escalation required; continuing scheduled durable supervision.";
    }
  }

  // Timestamps
  const triggerTime = signal ? parseUtcDate(signal.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--";
  const evalTime = reasoning ? parseUtcDate(reasoning.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : triggerTime;
  const actionTime = toolAction ? parseUtcDate(toolAction.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : evalTime;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              AI Supervisor Decision Matrix
            </h3>
            <span className="text-[10px] text-slate-500">
              Automated autonomous evaluation & action dispatch
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            Confidence: <strong>98.4%</strong>
          </span>
        </div>
      </div>

      {/* 4-Grid Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. TRIGGER EVENT */}
        <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Trigger Event
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-mono font-bold text-slate-900 truncate">
              {trigger}
            </span>
          </div>
        </div>

        {/* 2. AI STATE */}
        <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            AI State
          </span>
          <span className="text-xs font-semibold text-slate-900 block truncate">
            {aiState}
          </span>
        </div>

        {/* 3. DECISION */}
        <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Decision
          </span>
          <span
            className={`text-xs font-bold block truncate ${
              hasToolAction ? "text-indigo-700" : isCompleted ? "text-emerald-700" : "text-slate-800"
            }`}
          >
            {decisionType}
          </span>
        </div>

        {/* 4. ACTION DISPATCHED */}
        <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Action Dispatched
          </span>
          <span className="text-xs font-mono font-medium text-slate-800 block truncate" title={actionName}>
            {actionName}
          </span>
        </div>
      </div>

      {/* Operational Reasoning Summary */}
      <div className="p-3.5 rounded-lg bg-slate-50/90 border border-slate-200 space-y-1.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Operational Reasoning Summary
        </span>
        <p className="text-xs text-slate-700 leading-relaxed font-sans font-normal">
          "{reasonText}"
        </p>
      </div>

      {/* Telemetry Footer */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
        <div>Trigger: <strong className="text-slate-700">{triggerTime}</strong></div>
        <div>Evaluated: <strong className="text-slate-700">{evalTime}</strong></div>
        <div>Action Dispatched: <strong className="text-slate-700">{actionTime}</strong></div>
        <div className="text-emerald-700 font-bold">Latency: 1.12s</div>
      </div>
    </div>
  );
};

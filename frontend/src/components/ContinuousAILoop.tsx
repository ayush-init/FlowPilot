"use client";

import React from "react";
import {
  CheckCircle2,
  Moon,
  PlayCircle,
  Brain,
  Wrench,
  Bot,
  Clock,
  Zap,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { OrderRun, parseUtcDate } from "../lib/types";

interface ContinuousAILoopProps {
  run: OrderRun;
}

export const ContinuousAILoop: React.FC<ContinuousAILoopProps> = ({ run }) => {
  const activities = run.activities || [];

  // Find latest events
  const signal = activities.find((a) => a.activity_type === "SIGNAL_RECEIVED" || a.activity_type === "WORKFLOW_START");
  const wakeAct = activities.find((a) => a.activity_type === "AI_WAKE" || a.activity_type === "WAKE_DECISION");
  const reasoning = activities.find((a) => a.activity_type === "AGENT_REASONING" || a.activity_type === "AI_DECISION");
  const toolAction = activities.find((a) => a.activity_type === "TOOL_ACTION");
  const memoryAct = activities.find((a) => a.activity_type === "MEMORY_UPDATE");

  // Step 1: Event
  const eventName = signal?.metadata_json?.event_type || signal?.title?.replace("Signal Injected: ", "") || "order_created";

  // Step 2: Wake
  const wakeTime = wakeAct
    ? parseUtcDate(wakeAct.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : parseUtcDate(run.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Step 3: Decision
  const hasTool = !!toolAction;
  const decisionSummary = run.status === "COMPLETED"
    ? "Order Completed"
    : hasTool
    ? "Intervene & Escalate"
    : "Passive Monitor";

  // Step 4: Action
  const actionSummary = toolAction
    ? toolAction.title.replace(/^Action:\s*/, "")
    : "No Action Dispatched";

  // Step 5: Memory
  const memTime = memoryAct
    ? parseUtcDate(memoryAct.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : parseUtcDate(run.updated_at || run.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Step 6: Current State
  let currentStateTitle = "Dormant Sleep";
  let currentStateSub = "Until next cycle";
  if (run.status === "RUNNING") {
    currentStateTitle = hasTool ? "Executing Action" : "AI Thinking";
    currentStateSub = "Active Evaluation";
  } else if (run.status === "SLEEPING") {
    currentStateTitle = "Dormant Sleep";
    if (run.next_wakeup_at) {
      currentStateSub = `Until ${parseUtcDate(run.next_wakeup_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
  } else if (run.status === "PAUSED") {
    currentStateTitle = "Execution Paused";
    currentStateSub = "Awaiting Operator";
  } else if (run.status === "COMPLETED") {
    currentStateTitle = "Completed";
    currentStateSub = "Lifecycle Fulfilled";
  } else if (run.status === "TERMINATED") {
    currentStateTitle = "Terminated";
    currentStateSub = "Operator Aborted";
  }

  // Step 7: Next
  let nextWakeSummary = "Scheduled review";
  if (run.next_wakeup_at && run.status === "SLEEPING") {
    nextWakeSummary = `${parseUtcDate(run.next_wakeup_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (run.status === "COMPLETED") {
    nextWakeSummary = "Terminal state";
  }

  const loopRunNumber = Math.max(1, activities.filter(a => a.activity_type === "AI_WAKE" || a.activity_type === "WAKE_DECISION").length);
  const executionId = run.temporal_workflow_id.slice(-6);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between text-xs pb-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Continuous AI Control Loop Pipeline
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span>Loop Cycle <strong className="text-slate-800 font-bold">#{loopRunNumber}</strong></span>
          <span className="text-slate-300">•</span>
          <span>Exec ID: <strong className="text-slate-700">e:{executionId}</strong></span>
        </div>
      </div>

      {/* 7-Step Pipeline Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {/* 01 / EVENT */}
        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 font-mono">01 / EVENT</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-900">Event Received</div>
            <div className="text-[10px] font-mono text-slate-600 truncate" title={eventName}>
              {eventName}
            </div>
          </div>
        </div>

        {/* 02 / WAKE */}
        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 font-mono">02 / WAKE</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-900">AI Wake</div>
            <div className="text-[10px] text-slate-600 truncate">
              Woke at {wakeTime}
            </div>
          </div>
        </div>

        {/* 03 / DECISION */}
        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 font-mono">03 / DECISION</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-900">AI Decision</div>
            <div className="text-[10px] text-slate-600 truncate" title={decisionSummary}>
              {decisionSummary}
            </div>
          </div>
        </div>

        {/* 04 / ACTION */}
        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 font-mono">04 / ACTION</span>
            <CheckCircle2 className={`h-3.5 w-3.5 ${hasTool ? "text-emerald-500" : "text-slate-400"}`} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-900">{hasTool ? "Dispatched" : "Action"}</div>
            <div className="text-[10px] font-mono text-slate-600 truncate" title={actionSummary}>
              {actionSummary}
            </div>
          </div>
        </div>

        {/* 05 / MEMORY */}
        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 font-mono">05 / MEMORY</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-900">Memory Lock</div>
            <div className="text-[10px] text-slate-600 truncate">
              Updated {memTime}
            </div>
          </div>
        </div>

        {/* 06 / CURRENT (Signature Highlighted Node) */}
        <div className={`p-2.5 rounded-lg border flex flex-col justify-between space-y-1 ${
          run.status === "RUNNING"
            ? "border-emerald-300 bg-emerald-600 text-white shadow-sm"
            : run.status === "COMPLETED"
            ? "border-emerald-300 bg-emerald-700 text-white shadow-sm"
            : run.status === "TERMINATED"
            ? "border-rose-300 bg-rose-600 text-white shadow-sm"
            : "border-indigo-400 bg-indigo-600 text-white shadow-sm"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-indigo-200 font-mono">06 / CURRENT</span>
            {run.status === "SLEEPING" ? (
              <Moon className="h-3.5 w-3.5 text-indigo-200" />
            ) : run.status === "RUNNING" ? (
              <Activity className="h-3.5 w-3.5 text-emerald-200 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-200" />
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold text-white leading-tight">{currentStateTitle}</div>
            <div className="text-[10px] text-indigo-100 font-medium truncate" title={currentStateSub}>
              {currentStateSub}
            </div>
          </div>
        </div>

        {/* 07 / NEXT */}
        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 font-mono">07 / NEXT</span>
            <Clock className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-900">Next Wake</div>
            <div className="text-[10px] font-mono text-slate-600 truncate" title={nextWakeSummary}>
              {nextWakeSummary}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

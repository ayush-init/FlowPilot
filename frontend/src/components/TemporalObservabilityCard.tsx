"use client";

import React, { useState } from "react";
import {
  Workflow,
  Copy,
  Check,
  Activity,
  Layers,
} from "lucide-react";
import { OrderRun } from "../lib/types";

interface TemporalObservabilityCardProps {
  run: OrderRun;
}

export const TemporalObservabilityCard: React.FC<TemporalObservabilityCardProps> = ({ run }) => {
  const [copied, setCopied] = useState(false);

  const copyWorkflowId = () => {
    navigator.clipboard.writeText(run.temporal_workflow_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDuration = () => {
    try {
      const start = new Date(run.created_at).getTime();
      const end = run.completed_at ? new Date(run.completed_at).getTime() : new Date().getTime();
      const diffSecs = Math.max(0, Math.floor((end - start) / 1000));
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      if (mins < 60) return `${mins}m ${secs}s`;
      const hours = Math.floor(mins / 60);
      return `${hours}h ${mins % 60}m`;
    } catch {
      return "0s";
    }
  };

  const supervisor = run.supervisor;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Workflow className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Workflow Telemetry & Engine
            </h3>
            <span className="text-[10px] text-slate-500">
              Temporal durable execution state
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono font-medium text-emerald-700 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
          Durable State
        </span>
      </div>

      {/* Workflow ID with Copy */}
      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Workflow Execution ID
          </span>
          <button
            onClick={copyWorkflowId}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-900 transition font-medium"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
        <p className="text-xs font-mono text-slate-800 truncate select-all">
          {run.temporal_workflow_id}
        </p>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Task Queue</span>
          <span className="font-mono text-slate-800 truncate block">order-supervisor-queue</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Duration</span>
          <span className="font-mono font-medium text-slate-800">{getDuration()}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Started At</span>
          <span className="font-mono text-slate-800">
            {new Date(run.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Activities</span>
          <span className="font-mono text-slate-800">{run.activities?.length || 0} events</span>
        </div>
      </div>

      {/* Policy Summary */}
      {supervisor && (
        <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Active Supervisor Policy
          </span>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">{supervisor.name}</span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center justify-between pt-0.5">
              <span>Aggressiveness: <strong className="text-slate-900 capitalize">{supervisor.aggressiveness}</strong></span>
              <span>Sleep: <strong className="text-slate-900">{supervisor.default_wakeup_interval_seconds / 60}m</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

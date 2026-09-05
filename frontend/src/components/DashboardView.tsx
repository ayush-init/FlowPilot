"use client";

import React from "react";
import {
  Boxes,
  Moon,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { OrderRun, Supervisor, parseUtcDate } from "../lib/types";

interface DashboardViewProps {
  runs: OrderRun[];
  supervisors: Supervisor[];
  onSelectRun: (runId: string) => void;
  onNavigateRuns: (filter?: string) => void;
  onOpenCreateRun: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  runs,
  supervisors,
  onSelectRun,
  onNavigateRuns,
  onOpenCreateRun,
}) => {
  const activeRuns = runs.filter((r) => r.status === "RUNNING" || r.status === "SLEEPING");
  const sleepingRuns = runs.filter((r) => r.status === "SLEEPING");
  const attentionRuns = runs.filter(
    (r) => r.activities?.some((a) => a.metadata_json?.event_type === "payment_failed" || a.metadata_json?.event_type === "shipment_delayed") && r.status !== "COMPLETED"
  );
  const completedRuns = runs.filter((r) => r.status === "COMPLETED");

  // Collect recent activities across runs
  const allActivities = runs.flatMap((r) =>
    (r.activities || []).map((a) => ({ ...a, runOrderId: r.order_id, runId: r.id }))
  );
  allActivities.sort(
    (a, b) => parseUtcDate(b.created_at).getTime() - parseUtcDate(a.created_at).getTime()
  );
  const recentActivities = allActivities.slice(0, 8);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-900 p-5 lg:p-7 space-y-6">
      {/* 1. Header Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Good morning, Ayush
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor and steer your autonomous AI order supervisors across real-time order lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateRuns()}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition"
          >
            View Fleet Table
          </button>
          <button
            onClick={onOpenCreateRun}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Order Run</span>
          </button>
        </div>
      </div>

      {/* 2. 4-Grid KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Runs */}
        <div
          onClick={() => onNavigateRuns("RUNNING")}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition cursor-pointer shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Runs
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <PlayCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">
            {activeRuns.length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Durable workflows running</span>
            <span className="text-emerald-600 font-semibold text-[10px]">Healthy</span>
          </div>
        </div>

        {/* Sleeping */}
        <div
          onClick={() => onNavigateRuns("SLEEPING")}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition cursor-pointer shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Sleeping (Dormant)
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Moon className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">
            {sleepingRuns.length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Awaiting signal or timer</span>
            <span className="text-indigo-600 font-semibold text-[10px]">Deterministic</span>
          </div>
        </div>

        {/* Needs Attention */}
        <div
          onClick={() => onNavigateRuns("needs_attention")}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition cursor-pointer shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Needs Attention
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">
            {attentionRuns.length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Delayed or payment exceptions</span>
            <span className="text-amber-600 font-semibold text-[10px]">
              {attentionRuns.length > 0 ? "Escalated" : "Zero Alerts"}
            </span>
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => onNavigateRuns("COMPLETED")}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition cursor-pointer shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Completed Today
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">
            {completedRuns.length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Delivered & verified</span>
            <span className="text-emerald-600 font-semibold text-[10px]">100% SLA</span>
          </div>
        </div>
      </div>

      {/* 3. Two-Column Operational Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Live Supervision Cards (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Live Supervision ({runs.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigateRuns()}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <span>View all runs</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {runs.slice(0, 5).map((run) => {
              const activities = run.activities || [];
              const lastSignal = activities.find((a) => a.activity_type === "SIGNAL_RECEIVED");
              const eventName = lastSignal?.metadata_json?.event_type || "order_created";

              return (
                <div
                  key={run.id}
                  onClick={() => onSelectRun(run.id)}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {run.order_id}
                        </span>
                        <span className="text-xs text-slate-600">
                          {run.current_state?.customer_name}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">
                          {run.current_state?.item}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3 text-indigo-600" />
                        <span>{run.supervisor?.name || "Autonomous Guardian"}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        run.status === "RUNNING"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : run.status === "SLEEPING"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : run.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Last Event</span>
                      <span className="font-mono text-slate-800 font-medium truncate block">{eventName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Next Wake</span>
                      <span className="font-mono text-slate-800 font-medium truncate block">
                        {run.next_wakeup_at
                          ? parseUtcDate(run.next_wakeup_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "On Event Signal"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recent AI Activity & Quick Actions (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          {/* Recent AI Activity */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Recent AI Activity
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Live Stream</span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => onSelectRun(act.runId)}
                  className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition cursor-pointer space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">
                      {act.runOrderId}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {parseUtcDate(act.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-slate-700 font-medium text-[11px] truncate">
                    {act.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-100">
              Quick Operations
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={onOpenCreateRun}
                className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-indigo-600" />
                  <span>Launch New Order Run</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateRuns("RUNNING")}
                className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-emerald-600" />
                  <span>View Active Runs ({activeRuns.length})</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateRuns("needs_attention")}
                className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Review Needs Attention ({attentionRuns.length})</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

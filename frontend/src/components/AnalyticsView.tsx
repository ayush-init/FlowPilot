"use client";

import React from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { OrderRun } from "../lib/types";

interface AnalyticsViewProps {
  runs: OrderRun[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ runs }) => {
  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.status === "COMPLETED").length;
  const allToolActivities = runs.flatMap((r) => (r.activities || []).filter((a) => a.activity_type === "TOOL_ACTION"));
  const allWakeActivities = runs.flatMap((r) => (r.activities || []).filter((a) => a.activity_type === "AI_WAKE" || a.activity_type === "WAKE_DECISION"));

  // Breakdown of actions dispatched
  const actionCounts: Record<string, number> = {
    message_logistics_team: 0,
    message_customer: 0,
    message_fulfillment_team: 0,
    message_payments_team: 0,
    create_internal_note: 0,
  };

  allToolActivities.forEach((act) => {
    const raw = act.metadata_json?.name || act.title.replace(/^Action:\s*/, "");
    if (actionCounts[raw] !== undefined) {
      actionCounts[raw]++;
    } else {
      actionCounts.create_internal_note++;
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-900 p-5 lg:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Operations & AI Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational KPIs, autonomous supervisor resolution efficiency, and carrier SLA metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Aggregation
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Auto-Resolved Rate
          </span>
          <div className="text-2xl font-mono font-bold text-emerald-700 flex items-center justify-between">
            <span>97.8%</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500">Autonomous resolution without human escalation</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Median Wake Latency
          </span>
          <div className="text-2xl font-mono font-bold text-slate-900 flex items-center justify-between">
            <span>142ms</span>
            <Zap className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-[11px] text-slate-500">Temporal signal to AI reasoning latency</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Actions Dispatched
          </span>
          <div className="text-2xl font-mono font-bold text-indigo-700 flex items-center justify-between">
            <span>{allToolActivities.length}</span>
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-[11px] text-slate-500">Automated business interventions</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total AI Cycles
          </span>
          <div className="text-2xl font-mono font-bold text-slate-900 flex items-center justify-between">
            <span>{allWakeActivities.length}</span>
            <Clock className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-[11px] text-slate-500">Wake, evaluate & compact cycles</p>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions Breakdown */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
            Dispatched Business Actions Breakdown
          </h3>

          <div className="space-y-3">
            {[
              { label: "Logistics Carrier Escalation", count: actionCounts.message_logistics_team, color: "bg-blue-600" },
              { label: "Customer Proactive Reassurance", count: actionCounts.message_customer, color: "bg-emerald-600" },
              { label: "Warehouse Fulfillment Priority", count: actionCounts.message_fulfillment_team, color: "bg-amber-600" },
              { label: "Payments & Billing Alert", count: actionCounts.message_payments_team, color: "bg-rose-600" },
              { label: "Internal Audit Log", count: actionCounts.create_internal_note, color: "bg-indigo-600" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span className="font-medium">{item.label}</span>
                  <span className="font-mono font-bold">{item.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{
                      width: `${allToolActivities.length > 0 ? (item.count / allToolActivities.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Efficiency Card */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
            Autonomous Operational Efficiency
          </h3>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Durable Sleep Efficiency</span>
                <span className="text-[11px] text-slate-500">Zero compute used during restful timers</span>
              </div>
              <span className="font-mono font-bold text-indigo-700 text-sm">99.4%</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Working Memory Compaction</span>
                <span className="text-[11px] text-slate-500">Context tokens compacted per wake</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 text-sm">84.2%</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">SLA Compliance Rate</span>
                <span className="text-[11px] text-slate-500">Orders monitored without SLA breach</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">100.0%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

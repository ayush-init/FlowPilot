"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Clock,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  XCircle,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Sparkles,
  Layers,
} from "lucide-react";
import { OrderRun, Supervisor, parseUtcDate } from "../lib/types";

interface OrderRunsTableProps {
  runs: OrderRun[];
  supervisors: Supervisor[];
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
  onOpenCreateRun: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const OrderRunsTable: React.FC<OrderRunsTableProps> = ({
  runs,
  supervisors,
  selectedRunId,
  onSelectRun,
  onOpenCreateRun,
  onRefresh,
  loading,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("today");

  // Filter calculations
  const totalCount = runs.length;
  const runningCount = runs.filter((r) => r.status === "RUNNING").length;
  const sleepingCount = runs.filter((r) => r.status === "SLEEPING").length;
  const needsAttentionCount = runs.filter(
    (r) => r.activities?.some((a) => a.metadata_json?.event_type === "payment_failed" || a.metadata_json?.event_type === "shipment_delayed") && r.status !== "COMPLETED"
  ).length;
  const completedCount = runs.filter((r) => r.status === "COMPLETED").length;
  const terminatedCount = runs.filter((r) => r.status === "TERMINATED").length;

  const filteredRuns = runs.filter((r) => {
    // Status filter
    if (filterStatus === "RUNNING" && r.status !== "RUNNING") return false;
    if (filterStatus === "SLEEPING" && r.status !== "SLEEPING") return false;
    if (filterStatus === "COMPLETED" && r.status !== "COMPLETED") return false;
    if (filterStatus === "TERMINATED" && r.status !== "TERMINATED") return false;
    if (filterStatus === "needs_attention") {
      const isAttention = r.activities?.some(
        (a) => a.metadata_json?.event_type === "payment_failed" || a.metadata_json?.event_type === "shipment_delayed"
      ) && r.status !== "COMPLETED";
      if (!isAttention) return false;
    }

    // Supervisor filter
    if (selectedSupervisor !== "all" && r.supervisor_id !== selectedSupervisor) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const orderMatch = r.order_id.toLowerCase().includes(q);
      const custMatch = (r.current_state?.customer_name || "").toLowerCase().includes(q);
      const itemMatch = (r.current_state?.item || "").toLowerCase().includes(q);
      if (!orderMatch && !custMatch && !itemMatch) return false;
    }

    return true;
  });

  const getRelativeTime = (dateStr: string) => {
    try {
      const diff = Math.floor((new Date().getTime() - parseUtcDate(dateStr).getTime()) / 1000);
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return "recently";
    }
  };

  const getNextWakeInfo = (run: OrderRun) => {
    if (run.status === "COMPLETED") {
      return { title: "None (Done)", sub: "History Archival Active" };
    }
    if (run.status === "TERMINATED") {
      return { title: "None", sub: "Workflow Aborted" };
    }
    if (run.status === "RUNNING") {
      return { title: "In progress...", sub: "Evaluating Event Context" };
    }
    if (run.next_wakeup_at) {
      const timeStr = parseUtcDate(run.next_wakeup_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const diffMins = Math.max(0, Math.floor((parseUtcDate(run.next_wakeup_at).getTime() - new Date().getTime()) / 60000));
      return { title: timeStr, sub: `Timer: in ${diffMins}m` };
    }
    return { title: "On Event Signal", sub: "Passive Monitoring" };
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-900 p-5 lg:p-7 space-y-5">
      {/* 1. Header Banner with Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-indigo-700 uppercase tracking-wider font-bold">
            <span>Temporal Workflow Engine</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-normal">Cluster: iad-temporal-prod-04</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Order Runs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            All autonomous AI supervisor workflows tracked across Temporal runtime with deterministic replay state.
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs min-w-[110px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Instances
            </span>
            <div className="text-lg font-mono font-bold text-slate-900 flex items-center gap-1.5">
              <span>{runningCount + sleepingCount}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">+12.4%</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs min-w-[110px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Median Wake Latency
            </span>
            <div className="text-lg font-mono font-bold text-slate-900">
              142ms
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs min-w-[120px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Auto-Resolved Rate
            </span>
            <div className="text-lg font-mono font-bold text-emerald-700 flex items-center gap-1">
              <span>97.8%</span>
              <span className="text-[9px] px-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">L3 AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Status Tabs & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 text-xs shadow-xs overflow-x-auto">
          {[
            { id: "all", label: "All Runs", count: totalCount },
            { id: "RUNNING", label: "Running", count: runningCount, dot: "bg-emerald-500" },
            { id: "SLEEPING", label: "Sleeping", count: sleepingCount, dot: "bg-indigo-500" },
            { id: "needs_attention", label: "Needs Attention", count: needsAttentionCount, dot: "bg-amber-500" },
            { id: "COMPLETED", label: "Completed", count: completedCount, dot: "bg-emerald-500" },
            { id: "TERMINATED", label: "Terminated", count: terminatedCount, dot: "bg-slate-400" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              {tab.dot && <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} />}
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  filterStatus === tab.id ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* New Order Run CTA */}
        <button
          onClick={onOpenCreateRun}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Order Run</span>
        </button>
      </div>

      {/* 3. Search & Toolbar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer, Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-700"
            >
              Esc
            </button>
          )}
        </div>

        {/* Filters and Time Ranges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Supervisor Filter */}
          <select
            value={selectedSupervisor}
            onChange={(e) => setSelectedSupervisor(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Supervisor: All Types</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Time Ranges */}
          <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            {["Today", "7D", "30D"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t.toLowerCase())}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                  timeRange === t.toLowerCase() ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
            title="Refresh fleet"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4. Notice Banner */}
      <div className="px-4 py-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600 flex-shrink-0" />
          <span className="font-semibold">Autonomous Supervisor Fleet Active:</span>
          <span className="text-indigo-700 hidden sm:inline">
            Re-evaluating routing conditions dynamically based on carrier latency telemetry.
          </span>
        </div>
        <span className="text-[10px] font-mono text-indigo-600 flex items-center gap-1 flex-shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Live Sync: 4s ago
        </span>
      </div>

      {/* 5. Main Operational Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Order & Customer</th>
                <th className="py-3 px-4">Supervisor Archetype</th>
                <th className="py-3 px-4">Autonomous State</th>
                <th className="py-3 px-4">Last Runtime Event</th>
                <th className="py-3 px-4">Next Scheduled Wake-up</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No order runs matching your filter</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try adjusting the status filter or search term.</p>
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => {
                  const activities = run.activities || [];
                  const lastAct = activities.length > 0 ? activities[0] : null;
                  const lastSignal = activities.find((a) => a.activity_type === "SIGNAL_RECEIVED" || a.activity_type === "WORKFLOW_START");
                  const isAttention = activities.some(
                    (a) => a.metadata_json?.event_type === "payment_failed" || a.metadata_json?.event_type === "shipment_delayed"
                  ) && run.status !== "COMPLETED";

                  const eventName = lastSignal?.metadata_json?.event_type || lastSignal?.title?.replace("Signal Injected: ", "") || "order_created";
                  const eventRelTime = lastSignal ? getRelativeTime(lastSignal.created_at) : "recently";
                  const nextWake = getNextWakeInfo(run);

                  return (
                    <tr
                      key={run.id}
                      onClick={() => onSelectRun(run.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Order & Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition">
                            {run.order_id}
                          </span>
                          {isAttention && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              !
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span>{run.current_state?.customer_name || "Valued Customer"}</span>
                          <span className="text-slate-300 mx-1">•</span>
                          <span>{run.current_state?.item || "Standard Item"}</span>
                          <span className="text-slate-400 font-mono ml-1">(${run.current_state?.amount || "189.99"})</span>
                        </div>
                      </td>

                      {/* Supervisor Archetype */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                          <span className="font-semibold text-slate-900">
                            {run.supervisor?.name || "Autonomous Guardian"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Order: <span className="font-medium text-slate-700 capitalize">{run.current_state?.order_status || "Processing"}</span>
                        </div>
                      </td>

                      {/* Autonomous State Pill */}
                      <td className="py-3.5 px-4">
                        {isAttention ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            NEEDS ATTENTION
                          </span>
                        ) : run.status === "SLEEPING" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            SLEEPING
                          </span>
                        ) : run.status === "RUNNING" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                            RUNNING
                          </span>
                        ) : run.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            COMPLETED
                          </span>
                        ) : run.status === "PAUSED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                            <PauseCircle className="h-3 w-3 text-amber-600" />
                            PAUSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="h-3 w-3 text-rose-600" />
                            TERMINATED
                          </span>
                        )}
                      </td>

                      {/* Last Runtime Event */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-medium text-slate-900 truncate max-w-[170px]" title={eventName}>
                          {eventName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {eventRelTime}
                        </div>
                      </td>

                      {/* Next Scheduled Wake-up */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-900 font-mono font-semibold">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{nextWake.title}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {nextWake.sub}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRun(run.id);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-semibold transition shadow-2xs inline-flex items-center gap-1"
                        >
                          <span>View Run</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

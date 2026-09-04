"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  PlayCircle,
  PauseCircle,
  ShieldAlert,
  Award,
  RefreshCw,
  ShoppingBag,
  Bot,
  BrainCircuit,
  MapPin,
  DollarSign,
  User,
} from "lucide-react";
import { OrderRun } from "../lib/types";
import { pauseRun, resumeRun, terminateRun, fetchRunDetail } from "../lib/api";
import { EventSimulator } from "./EventSimulator";
import { InstructionInjector } from "./InstructionInjector";
import { ActivityTimeline } from "./ActivityTimeline";
import { RetrospectiveModal } from "./RetrospectiveModal";

interface RunDetailProps {
  runId: string;
  onRefreshList: () => void;
}

export const RunDetail: React.FC<RunDetailProps> = ({ runId, onRefreshList }) => {
  const [run, setRun] = useState<OrderRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRetrospective, setShowRetrospective] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchRunDetail(runId);
      setRun(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto polling for live workflow updates every 3 seconds while active
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, [runId]);

  if (loading || !run) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const isTerminal = run.status === "COMPLETED" || run.status === "TERMINATED";
  const isPaused = run.status === "PAUSED";

  const handlePause = async () => {
    setActionLoading(true);
    await pauseRun(run.id);
    await loadData();
    onRefreshList();
    setActionLoading(false);
  };

  const handleResume = async () => {
    setActionLoading(true);
    await resumeRun(run.id);
    await loadData();
    onRefreshList();
    setActionLoading(false);
  };

  const handleTerminate = async () => {
    if (!confirm("Are you sure you want to terminate this workflow run?")) return;
    setActionLoading(true);
    await terminateRun(run.id, "Operator manually stopped run");
    await loadData();
    onRefreshList();
    setActionLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Run Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-mono font-bold text-white tracking-tight">
                {run.order_id}
              </h2>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                  run.status === "RUNNING"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse"
                    : run.status === "SLEEPING"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : run.status === "PAUSED"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : run.status === "COMPLETED"
                    ? "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {run.status === "RUNNING" && <PlayCircle className="h-3 w-3" />}
                {run.status === "SLEEPING" && <Clock className="h-3 w-3" />}
                {run.status === "PAUSED" && <PauseCircle className="h-3 w-3" />}
                {run.status === "TERMINATED" && <ShieldAlert className="h-3 w-3" />}
                {run.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Workflow ID: <span className="font-mono text-slate-300">{run.temporal_workflow_id}</span>
            </p>
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isTerminal && (
              <>
                {!isPaused ? (
                  <button
                    onClick={handlePause}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium border border-amber-500/30 transition"
                  >
                    <PauseCircle className="h-3.5 w-3.5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    <span>Resume</span>
                  </button>
                )}
                <button
                  onClick={handleTerminate}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-medium border border-rose-500/30 transition"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Terminate</span>
                </button>
              </>
            )}

            {(isTerminal || run.final_summary) && (
              <button
                onClick={() => setShowRetrospective(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/40 transition"
              >
                <Award className="h-3.5 w-3.5" />
                <span>View Retrospective</span>
              </button>
            )}
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShoppingBag className="h-3.5 w-3.5 text-indigo-400" />
            <span className="truncate">{run.current_state?.item || "Standard Order"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            <span>${run.current_state?.amount || "189.99"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <User className="h-3.5 w-3.5 text-sky-400" />
            <span className="truncate">{run.current_state?.customer_name || "Customer"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>
              {run.next_wakeup_at
                ? `Next wake: ${new Date(run.next_wakeup_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : isTerminal
                ? "Completed"
                : "Active"}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Context, Memory, Injectors */}
        <div className="lg:col-span-5 space-y-6">
          {/* Compact Memory Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <BrainCircuit className="h-4 w-4" />
                <span>Rolling Compact Memory</span>
              </div>
              <span className="text-[10px] text-slate-500">Auto-compacted</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-mono whitespace-pre-wrap">
              {run.compact_memory || "Supervisor initializing context..."}
            </p>
          </div>

          {/* Event Simulator */}
          <EventSimulator
            runId={run.id}
            isTerminal={isTerminal}
            onEventSent={loadData}
          />

          {/* Live Instruction Injector */}
          <InstructionInjector
            runId={run.id}
            isTerminal={isTerminal}
            onInstructionSent={loadData}
          />
        </div>

        {/* Right Column: Unified Chronological Activity Timeline */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Audit & Activity Stream ({run.activities?.length || 0})
            </h3>
            <span className="text-[10px] text-slate-500">Real-Time Event Stream</span>
          </div>

          <ActivityTimeline activities={run.activities || []} />
        </div>
      </div>

      {/* Retrospective Modal */}
      <RetrospectiveModal
        isOpen={showRetrospective}
        onClose={() => setShowRetrospective(false)}
        run={run}
      />
    </div>
  );
};

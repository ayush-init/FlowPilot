"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlayCircle,
  PauseCircle,
  ShieldAlert,
  Award,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  User,
  Clock,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { OrderRun, parseUtcDate } from "../lib/types";
import { pauseRun, resumeRun, terminateRun, fetchRunDetail } from "../lib/api";
import { SupervisorStateHero } from "./SupervisorStateHero";
import { AIDecisionCard } from "./AIDecisionCard";
import { BusinessActionsList } from "./BusinessActionsList";
import { EventSimulator } from "./EventSimulator";
import { ActivityTimeline } from "./ActivityTimeline";
import { AIMemoryPanel } from "./AIMemoryPanel";
import { InstructionInjector } from "./InstructionInjector";
import { TemporalObservabilityCard } from "./TemporalObservabilityCard";
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
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchRunDetail(runId);
      setRun(data);
    } catch (err) {
      console.error("Failed to load run detail", err);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    setLoading(true);
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading || !run) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 space-y-3">
        <RefreshCw className="h-7 w-7 text-indigo-600 animate-spin" />
        <span className="text-xs font-mono">Synchronizing workflow telemetry...</span>
      </div>
    );
  }

  const isTerminal = run.status === "COMPLETED" || run.status === "TERMINATED";
  const isPaused = run.status === "PAUSED";

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await pauseRun(run.id);
      await loadData();
      onRefreshList();
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await resumeRun(run.id);
      await loadData();
      onRefreshList();
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminate = async () => {
    setActionLoading(true);
    try {
      await terminateRun(run.id, "Operator manually terminated run");
      await loadData();
      onRefreshList();
      setShowTerminateConfirm(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-900 p-4 lg:p-6 space-y-6">
      {/* 1. Main Run Header & Metadata Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-lg lg:text-xl font-mono font-bold text-slate-900 tracking-tight">
                {run.order_id}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Policy: <strong className="text-slate-800">{run.supervisor?.name || "Guardian Policy"}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span>Workflow ID:</span>
              <span className="font-mono text-slate-700 text-[11px] truncate max-w-xs md:max-w-md">
                {run.temporal_workflow_id}
              </span>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isTerminal && (
              <>
                {!isPaused ? (
                  <button
                    onClick={handlePause}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition disabled:opacity-50 shadow-xs"
                  >
                    <PauseCircle className="h-3.5 w-3.5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition disabled:opacity-50 shadow-xs"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  onClick={() => setShowTerminateConfirm(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold border border-rose-200 transition disabled:opacity-50 shadow-xs"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Terminate</span>
                </button>
              </>
            )}

            {(isTerminal || run.final_summary) && (
              <button
                onClick={() => setShowRetrospective(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Award className="h-3.5 w-3.5" />
                <span>View Retrospective</span>
              </button>
            )}
          </div>
        </div>

        {/* Order Details Mini-Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-indigo-600" />
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Customer</span>
              <span className="text-slate-900 font-semibold truncate block">
                {run.current_state?.customer_name || "Alex Rivers"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Product Item</span>
              <span className="text-slate-900 font-semibold truncate block">
                {run.current_state?.item || "Mechanical Keyboard Pro"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Order Amount</span>
              <span className="text-emerald-700 font-mono font-bold">
                ${run.current_state?.amount || "189.99"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Started At</span>
              <span className="text-slate-700 font-mono">
                {parseUtcDate(run.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Stage (Center vs Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* CENTER COLUMN: Live Supervisor Activity & Event Simulator (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          <SupervisorStateHero run={run} />
          <AIDecisionCard run={run} />
          <BusinessActionsList activities={run.activities || []} />
          <EventSimulator
            runId={run.id}
            isTerminal={isTerminal}
            onEventSent={loadData}
          />

          {/* Live Activity Stream */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Live Audit & Activity Stream ({run.activities?.length || 0})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Chronological record</span>
            </div>

            <ActivityTimeline activities={run.activities || []} />
          </div>
        </div>

        {/* RIGHT COLUMN: State Memory + Guidance + Observability (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          <AIMemoryPanel run={run} />
          <InstructionInjector
            run={run}
            isTerminal={isTerminal}
            onInstructionSent={loadData}
          />
          <TemporalObservabilityCard run={run} />
        </div>
      </div>

      {/* Retrospective Modal */}
      <RetrospectiveModal
        isOpen={showRetrospective}
        onClose={() => setShowRetrospective(false)}
        run={run}
      />

      {/* Terminate Confirmation Modal */}
      {showTerminateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-slate-900">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Terminate Workflow Run?</h3>
                <p className="text-xs text-slate-500">This will immediately cease order supervision.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to terminate order run <strong className="text-slate-900 font-mono">{run.order_id}</strong>? The workflow will stop execution and no further signals will be evaluated.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTerminateConfirm(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
              >
                {actionLoading ? "Terminating..." : "Confirm Termination"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

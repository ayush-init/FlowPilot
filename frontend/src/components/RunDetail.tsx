"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  Award,
  Zap,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  User,
  ShoppingBag,
  DollarSign,
  Lock,
} from "lucide-react";
import { OrderRun, parseUtcDate } from "../lib/types";
import { fetchRun, pauseRun, resumeRun, terminateRun, sendEventSignal } from "../lib/api";
import { SupervisorStateHero } from "./SupervisorStateHero";
import { ContinuousAILoop } from "./ContinuousAILoop";
import { AIDecisionCard } from "./AIDecisionCard";
import { AIMemoryPanel } from "./AIMemoryPanel";
import { ActivityTimeline } from "./ActivityTimeline";
import { EventSimulator } from "./EventSimulator";
import { InstructionInjector } from "./InstructionInjector";
import { BusinessActionsList } from "./BusinessActionsList";
import { TemporalObservabilityCard } from "./TemporalObservabilityCard";
import { RetrospectiveModal } from "./RetrospectiveModal";

interface RunDetailProps {
  runId: string;
  onBack?: () => void;
  onRefreshList: () => void;
}

export const RunDetail: React.FC<RunDetailProps> = ({
  runId,
  onBack,
  onRefreshList,
}) => {
  const [run, setRun] = useState<OrderRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRetrospective, setShowRetrospective] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchRun(runId);
      setRun(data);
    } catch (err) {
      console.error("Failed to load run detail", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, [runId]);

  if (loading && !run) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs text-slate-500 font-medium">Loading supervisor execution context...</p>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center space-y-2 max-w-sm">
          <p className="text-sm font-bold text-slate-900">Run not found</p>
          <p className="text-xs text-slate-500">
            The requested workflow run could not be retrieved.
          </p>
        </div>
      </div>
    );
  }

  const isTerminal = run.status === "COMPLETED" || run.status === "TERMINATED";
  const isPaused = run.status === "PAUSED";

  const copyWorkflowId = () => {
    navigator.clipboard.writeText(run.temporal_workflow_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await pauseRun(run.id, "Operator paused run from console");
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

  const handleForceWake = async () => {
    setActionLoading(true);
    try {
      await sendEventSignal(run.id, "operator_force_wake", {
        reason: "Operator initiated force wake checkpoint",
        timestamp: new Date().toISOString(),
      });
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

  const getRunTime = () => {
    try {
      const start = parseUtcDate(run.created_at).getTime();
      const end = run.completed_at ? parseUtcDate(run.completed_at).getTime() : new Date().getTime();
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-900 p-4 lg:p-6 space-y-5">
      {/* 1. Header with Breadcrumb, Metadata & Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Top Bar with Back Link & Title */}
            <div className="flex items-center gap-3 flex-wrap">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-semibold transition pr-2 border-r border-slate-200"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Order Runs</span>
                </button>
              )}

              <span className="text-xl lg:text-2xl font-mono font-bold text-slate-900 tracking-tight">
                {run.order_id}
              </span>

              <span className="text-xs text-slate-700 font-medium">
                {run.current_state?.customer_name || "Valued Customer"}
              </span>

              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {run.current_state?.item || "Order Item"} • ${run.current_state?.amount || "199.99"}
              </span>

              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                {run.supervisor?.name || "VIP Escalation Specialist"}
              </span>
            </div>

            {/* Telemetry Bar */}
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono flex-wrap pt-1">
              <div className="flex items-center gap-1">
                <span>ID:</span>
                <span className="text-slate-800 font-bold max-w-[200px] truncate">{run.temporal_workflow_id}</span>
                <button
                  onClick={copyWorkflowId}
                  className="p-0.5 hover:text-slate-900 transition"
                  title="Copy Workflow ID"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>

              <span className="text-slate-300">•</span>
              <div>Queue: <strong className="text-slate-700">order-supervisor-queue</strong></div>
              <span className="text-slate-300">•</span>
              <div>Run Time: <strong className="text-slate-700">{getRunTime()}</strong></div>
              <span className="text-slate-300">•</span>

              <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200 font-sans font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Temporal Engine Deterministic Lock
              </div>
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
                  onClick={handleForceWake}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                  title="Interrupt dormant sleep and force immediate AI evaluation"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Interrupt / Force Wake</span>
                </button>

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
      </div>

      {/* 2. Hero State Banner */}
      <SupervisorStateHero run={run} />

      {/* 3. Continuous AI Control Loop Pipeline */}
      <ContinuousAILoop run={run} />

      {/* 4. Two-Column Workspace Stage */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* CENTER COLUMN: AI Decision Matrix + Business Actions + Event Simulator (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          <AIDecisionCard run={run} />
          <BusinessActionsList activities={run.activities || []} />
          <EventSimulator
            runId={run.id}
            isTerminal={isTerminal}
            onEventSent={loadData}
          />
        </div>

        {/* RIGHT COLUMN: Working Memory + Live Guidance + Audit Stream (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          <AIMemoryPanel run={run} />
          <InstructionInjector
            run={run}
            isTerminal={isTerminal}
            onInstructionSent={loadData}
          />
          <ActivityTimeline activities={run.activities || []} />
          <TemporalObservabilityCard run={run} />
        </div>
      </div>

      {/* Terminate Confirmation Modal */}
      {showTerminateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-slate-900">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900">Terminate Order Workflow?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Terminating this workflow will immediately halt all automated wake checks, disable actions, and cancel the Temporal durable execution timer for order <strong>#{run.order_id}</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowTerminateConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {actionLoading ? "Terminating..." : "Confirm Termination"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End-of-Run Retrospective Modal */}
      <RetrospectiveModal
        isOpen={showRetrospective}
        onClose={() => setShowRetrospective(false)}
        run={run}
      />
    </div>
  );
};

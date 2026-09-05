"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { OrderRun, parseUtcDate } from "../lib/types";

interface SupervisorStateHeroProps {
  run: OrderRun;
}

export const SupervisorStateHero: React.FC<SupervisorStateHeroProps> = ({ run }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  const reasoningActivities = (run.activities || []).filter(
    (a) => a.activity_type === "AGENT_REASONING" || a.activity_type === "WAKE_DECISION"
  );
  const lastReasoning = reasoningActivities.length > 0 ? reasoningActivities[0] : null;

  const lastDecisionText = lastReasoning
    ? lastReasoning.content.split("\n")[0].replace(/^[\*\-\#\s]+/, "")
    : run.status === "COMPLETED"
    ? "Order completed and delivered successfully. All supervisor tasks fulfilled."
    : "Supervisor initialized and actively monitoring order lifecycle.";

  useEffect(() => {
    if (!run.next_wakeup_at || run.status === "COMPLETED" || run.status === "TERMINATED") {
      setTimeRemaining("");
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = parseUtcDate(run.next_wakeup_at!).getTime();
      const diffMs = target - now;

      if (diffMs <= 0) {
        setTimeRemaining("Due now");
        return;
      }

      const diffSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${mins}m`);
      } else if (mins > 0) {
        setTimeRemaining(`${mins}m ${secs}s`);
      } else {
        setTimeRemaining(`${secs}s`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [run.next_wakeup_at, run.status]);

  const getStateInfo = () => {
    switch (run.status) {
      case "RUNNING":
        return {
          label: "RUNNING",
          badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <PlayCircle className="h-5 w-5 text-emerald-600" />,
          statusDesc: "Supervisor is currently awake, evaluating incoming signals, and executing necessary business actions.",
        };
      case "SLEEPING":
        return {
          label: "SLEEPING",
          badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <Clock className="h-5 w-5 text-blue-600" />,
          statusDesc: "Workflow is sleeping durably in Temporal. It will wake on external signals or scheduled checkpoint.",
        };
      case "PAUSED":
        return {
          label: "PAUSED",
          badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: <PauseCircle className="h-5 w-5 text-amber-600" />,
          statusDesc: "Workflow execution is paused by operator. Signals will be queued until resumed.",
        };
      case "COMPLETED":
        return {
          label: "COMPLETED",
          badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
          statusDesc: "Order delivery confirmed. Workflow has generated the final summary retrospective.",
        };
      case "TERMINATED":
        return {
          label: "TERMINATED",
          badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: <ShieldAlert className="h-5 w-5 text-rose-600" />,
          statusDesc: "Workflow was manually terminated before normal completion.",
        };
      default:
        return {
          label: run.status,
          badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <RefreshCw className="h-5 w-5 text-slate-500 animate-spin" />,
          statusDesc: "Supervisor initializing workflow state.",
        };
    }
  };

  const stateInfo = getStateInfo();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3.5 border-b border-slate-100">
        {/* State Badge & Title */}
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
            {stateInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Workflow State
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border flex items-center gap-1.5 ${stateInfo.badgeBg}`}
              >
                {stateInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">{stateInfo.statusDesc}</p>
          </div>
        </div>

        {/* Wakeup Countdown / Timer */}
        {run.status === "SLEEPING" && run.next_wakeup_at && (
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg bg-blue-50/70 border border-blue-100 self-start lg:self-auto">
            <Clock className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-[10px] text-blue-900 font-semibold uppercase tracking-wider">
                Next Scheduled Check
              </div>
              <div className="text-xs font-mono font-bold text-blue-700">
                {parseUtcDate(run.next_wakeup_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}{" "}
                {timeRemaining && <span className="text-[11px] text-blue-600 font-medium">({timeRemaining})</span>}
              </div>
            </div>
          </div>
        )}

        {run.status === "COMPLETED" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Workflow Completed Successfully</span>
          </div>
        )}
      </div>

      {/* Last Decision Banner */}
      <div className="mt-3 pt-0.5 flex items-start gap-2.5 text-xs text-slate-700">
        <FileCheck className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 font-semibold mr-1.5">Last Policy Decision:</strong>
          <span className="text-slate-600 font-normal leading-relaxed">
            "{lastDecisionText}"
          </span>
        </div>
      </div>
    </div>
  );
};

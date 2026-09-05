"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  ShieldAlert,
  Bot,
  Quote,
  Sparkles,
} from "lucide-react";
import { OrderRun, parseUtcDate } from "../lib/types";

interface SupervisorStateHeroProps {
  run: OrderRun;
}

export const SupervisorStateHero: React.FC<SupervisorStateHeroProps> = ({ run }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!run.next_wakeup_at || run.status !== "SLEEPING") {
      setTimeRemaining("");
      return;
    }

    const updateCountdown = () => {
      try {
        const target = parseUtcDate(run.next_wakeup_at!).getTime();
        const now = new Date().getTime();
        const diffSecs = Math.max(0, Math.floor((target - now) / 1000));

        if (diffSecs === 0) {
          setTimeRemaining("Due now");
          return;
        }

        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        if (mins < 60) {
          setTimeRemaining(`${mins}m ${secs < 10 ? "0" : ""}${secs}s`);
        } else {
          const hours = Math.floor(mins / 60);
          const remMins = mins % 60;
          setTimeRemaining(`${hours}h ${remMins}m`);
        }
      } catch {
        setTimeRemaining("");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [run.next_wakeup_at, run.status]);

  const activities = run.activities || [];
  const reasoning = activities.find((a) => a.activity_type === "AGENT_REASONING");
  const signal = activities.find((a) => a.activity_type === "SIGNAL_RECEIVED");
  const toolAction = activities.find((a) => a.activity_type === "TOOL_ACTION");

  // Extract clean reasoning quote
  let lastDecisionText = "";
  if (reasoning?.content) {
    const lines = reasoning.content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("```") && !l.startsWith("{") && !l.startsWith("[") && !l.toLowerCase().includes("system instruction"));
    lastDecisionText = lines.slice(0, 2).join(" ").replace(/[\*\#\_]/g, "");
  }

  if (!lastDecisionText) {
    if (run.status === "COMPLETED") {
      lastDecisionText = "Customer delivery confirmed. All order lifecycle milestones fulfilled and verified.";
    } else if (signal?.metadata_json?.event_type === "shipment_delayed") {
      lastDecisionText = "Shipment is currently delayed in sorting hub. Proactive carrier escalation dispatched; monitoring until next scheduled checkpoint.";
    } else if (toolAction) {
      lastDecisionText = "Operational exception identified. Dispatched department notification to prevent delivery SLA breach.";
    } else {
      lastDecisionText = "Order is progressing normally within carrier SLA thresholds. No additional intervention required.";
    }
  }

  // Determine headline
  let headline = "Scheduled order monitoring in progress";
  if (run.status === "SLEEPING") {
    if (signal?.metadata_json?.event_type === "shipment_delayed") {
      headline = "Waiting for shipment update";
    } else if (signal?.metadata_json?.event_type === "payment_confirmed") {
      headline = "Monitoring fulfillment preparation";
    } else {
      headline = "Waiting for next checkpoint or signal";
    }
  } else if (run.status === "RUNNING") {
    headline = toolAction ? "Executing business action & updating memory" : "Actively evaluating workflow context";
  } else if (run.status === "COMPLETED") {
    headline = "Order delivery completed & confirmed";
  } else if (run.status === "PAUSED") {
    headline = "Workflow execution paused by operator";
  } else if (run.status === "TERMINATED") {
    headline = "Workflow terminated by operator";
  }

  // Interval in minutes
  const intervalMins = run.supervisor?.default_wakeup_interval_seconds
    ? Math.round(run.supervisor.default_wakeup_interval_seconds / 60)
    : 60;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
              run.status === "RUNNING"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 animate-pulse"
                : run.status === "SLEEPING"
                ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                : run.status === "COMPLETED"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : run.status === "PAUSED"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {run.status === "SLEEPING" ? "SLEEPING STATE ACTIVE" : `${run.status} STATE ACTIVE`}
          </span>

          <span className="text-xs text-slate-500 font-medium">
            Supervisor: <strong className="text-slate-800">{run.supervisor?.name || "Standard E-Commerce Guardian"}</strong>
          </span>
        </div>

        {run.status === "SLEEPING" && run.next_wakeup_at && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>Interval: <strong className="text-slate-800">{intervalMins}m</strong></span>
          </div>
        )}
      </div>

      {/* Main Headline & Next Wake Box */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-3 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {headline}
          </h2>

          {/* Last Decision Quote Callout */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-slate-50/80 border border-slate-200 text-xs">
            <Quote className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-slate-700 italic leading-relaxed font-sans">
              "{lastDecisionText}"
            </p>
          </div>
        </div>

        {/* Right Timer Box */}
        {run.status === "SLEEPING" && run.next_wakeup_at ? (
          <div className="flex-shrink-0 p-4 rounded-xl bg-slate-50 border border-slate-200 min-w-[210px] space-y-2">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Next Wake Check
              </div>
              <div className="text-xl font-mono font-bold text-slate-900">
                {parseUtcDate(run.next_wakeup_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Interval: {intervalMins} mins</div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Countdown</span>
              <div className="text-xs font-mono font-bold text-indigo-700 flex items-center gap-1">
                <span>{timeRemaining || "Calculating..."}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>
        ) : run.status === "RUNNING" ? (
          <div className="flex-shrink-0 p-4 rounded-xl bg-emerald-50 border border-emerald-200 min-w-[210px] space-y-1.5 text-center">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <PlayCircle className="h-4 w-4 text-emerald-600 animate-spin" />
              <span>Supervisor Active</span>
            </div>
            <div className="text-xs text-emerald-700 font-medium">Evaluating context & actions</div>
          </div>
        ) : run.status === "COMPLETED" ? (
          <div className="flex-shrink-0 p-4 rounded-xl bg-emerald-50 border border-emerald-200 min-w-[210px] space-y-1.5 text-center">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Completed</span>
            </div>
            <div className="text-xs text-emerald-700 font-medium">All milestones achieved</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

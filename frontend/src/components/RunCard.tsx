"use client";

import React from "react";
import {
  Clock,
  CheckCircle2,
  ShieldAlert,
  Bot,
  Zap,
} from "lucide-react";
import { OrderRun } from "../lib/types";

interface RunCardProps {
  run: OrderRun;
  isSelected: boolean;
  onSelect: () => void;
}

export const RunCard: React.FC<RunCardProps> = ({ run, isSelected, onSelect }) => {
  const getRelativeTime = (timestamp: string) => {
    try {
      const now = new Date().getTime();
      const time = new Date(timestamp).getTime();
      const diffSecs = Math.max(0, Math.floor((now - time) / 1000));
      if (diffSecs < 60) return "just now";
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return "recently";
    }
  };

  const getSupervisorStatusBadge = (status: string) => {
    switch (status) {
      case "RUNNING":
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            RUNNING
          </span>
        );
      case "SLEEPING":
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            SLEEPING
          </span>
        );
      case "PAUSED":
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            PAUSED
          </span>
        );
      case "COMPLETED":
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="h-2.5 w-2.5 text-slate-500" />
            COMPLETED
          </span>
        );
      case "TERMINATED":
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="h-2.5 w-2.5 text-rose-500" />
            TERMINATED
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const customerName = run.current_state?.customer_name || "Customer";
  const orderItem = run.current_state?.item || "Standard Order";
  const lastActivity = run.activities && run.activities.length > 0 ? run.activities[0] : null;

  return (
    <div
      onClick={onSelect}
      className={`p-3.5 rounded-xl cursor-pointer transition-all border text-left ${
        isSelected
          ? "bg-indigo-50/50 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20"
          : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs"
      }`}
    >
      {/* Top Row: Order ID and Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-mono font-bold text-xs text-slate-900 tracking-tight">
          {run.order_id}
        </span>
        {getSupervisorStatusBadge(run.status)}
      </div>

      {/* Customer and Amount */}
      <div className="flex items-center justify-between text-xs text-slate-800 font-medium mb-1">
        <span className="truncate max-w-[150px]">{customerName}</span>
        <span className="text-[11px] font-mono text-slate-600 font-semibold">
          ${run.current_state?.amount || "189.99"}
        </span>
      </div>

      <div className="text-[11px] text-slate-500 truncate mb-2.5">
        {orderItem}
      </div>

      {/* Last Event Summary */}
      {lastActivity && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-150 text-[10px] text-slate-600 mb-2.5">
          <Zap className="h-3 w-3 text-indigo-600 flex-shrink-0" />
          <span className="truncate">{lastActivity.title}</span>
        </div>
      )}

      {/* Footer: Policy Persona and Relative Time */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2">
        <div className="flex items-center gap-1 text-slate-600">
          <Bot className="h-3 w-3 text-slate-400" />
          <span className="truncate max-w-[120px] font-medium">{run.supervisor?.name || "Guardian Policy"}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="h-2.5 w-2.5" />
          <span>{getRelativeTime(run.updated_at || run.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

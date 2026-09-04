"use client";

import React from "react";
import { Bot, Clock, AlertCircle, CheckCircle2, PauseCircle, PlayCircle, ShieldAlert } from "lucide-react";
import { OrderRun } from "../lib/types";

interface RunCardProps {
  run: OrderRun;
  isSelected: boolean;
  onSelect: () => void;
}

export const RunCard: React.FC<RunCardProps> = ({ run, isSelected, onSelect }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RUNNING":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
            <PlayCircle className="h-3 w-3" />
            RUNNING
          </span>
        );
      case "SLEEPING":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Clock className="h-3 w-3" />
            SLEEPING
          </span>
        );
      case "PAUSED":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <PauseCircle className="h-3 w-3" />
            PAUSED
          </span>
        );
      case "COMPLETED":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">
            <CheckCircle2 className="h-3 w-3" />
            COMPLETED
          </span>
        );
      case "TERMINATED":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="h-3 w-3" />
            TERMINATED
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl cursor-pointer transition border text-left ${
        isSelected
          ? "bg-slate-800/90 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50"
          : "bg-slate-900/60 hover:bg-slate-800/50 border-slate-800/80"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-sm text-white tracking-wide">
          {run.order_id}
        </span>
        {getStatusBadge(run.status)}
      </div>

      <div className="text-xs text-slate-300 font-medium truncate mb-1">
        {run.current_state?.item || "Order Processing"}
      </div>

      <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
        {run.compact_memory || "Workflow initialized."}
      </p>

      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
        <div className="flex items-center gap-1">
          <Bot className="h-3 w-3 text-slate-400" />
          <span className="truncate max-w-[130px]">{run.supervisor?.name || "Guardian"}</span>
        </div>
        <span>{new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};

"use client";

import React, { useState } from "react";
import {
  Activity,
  Filter,
  Search,
  CheckCircle2,
  Moon,
  Zap,
  Brain,
  Wrench,
  Bot,
  UserCheck,
  PauseCircle,
  PlayCircle,
  XCircle,
  Award,
} from "lucide-react";
import { OrderRun, parseUtcDate } from "../lib/types";

interface ActivityViewProps {
  runs: OrderRun[];
  onSelectRun: (runId: string) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ runs, onSelectRun }) => {
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const allActivities = runs.flatMap((r) =>
    (r.activities || []).map((a) => ({
      ...a,
      orderId: r.order_id,
      runId: r.id,
      customerName: r.current_state?.customer_name,
    }))
  );

  allActivities.sort(
    (a, b) => parseUtcDate(b.created_at).getTime() - parseUtcDate(a.created_at).getTime()
  );

  const filtered = allActivities.filter((a) => {
    if (filterType !== "all" && a.activity_type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchOrder = a.orderId.toLowerCase().includes(q);
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchContent = (a.content || "").toLowerCase().includes(q);
      if (!matchOrder && !matchTitle && !matchContent) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-900 p-5 lg:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fleet Activity & Audit Stream
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time chronological telemetry feed across all active and historical order supervisor workflows.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search activity by order ID, title, summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {["all", "AI_WAKE", "AGENT_REASONING", "TOOL_ACTION", "SIGNAL_RECEIVED", "OPERATOR_DIRECTIVE"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition whitespace-nowrap ${
                filterType === type ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              {type === "all" ? "All Events" : type.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200 p-8">
            <Activity className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">No activities found</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectRun(item.runId)}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition cursor-pointer space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                    {item.orderId}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {parseUtcDate(item.created_at).toLocaleString()}
                </span>
              </div>

              {item.content && (
                <p className="text-xs text-slate-700 font-sans leading-relaxed pl-1">
                  {item.content.length > 200 ? item.content.slice(0, 200) + "..." : item.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

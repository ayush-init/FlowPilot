"use client";

import React, { useState } from "react";
import {
  Brain,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Zap,
  Target,
  FileText,
  HelpCircle,
} from "lucide-react";
import { OrderRun, parseUtcDate } from "../lib/types";

interface AIMemoryPanelProps {
  run: OrderRun;
}

export const AIMemoryPanel: React.FC<AIMemoryPanelProps> = ({ run }) => {
  const [showRawMemory, setShowRawMemory] = useState(false);

  const currentState = run.current_state || {};
  const activities = run.activities || [];

  // 1. Current Situation
  const isDelivered = run.status === "COMPLETED" || currentState.delivery_status === "delivered";
  const isDelayed = currentState.logistics_status === "delayed" || activities.some(a => a.metadata_json?.event_type === "shipment_delayed");
  const isShipped = currentState.logistics_status === "shipped" || activities.some(a => a.metadata_json?.event_type === "shipment_created");
  const isPaid = currentState.payment_status === "confirmed" || activities.some(a => a.metadata_json?.event_type === "payment_confirmed");
  
  let currentSituation = "Order placed. Monitoring initial verification.";
  if (isDelivered) {
    currentSituation = "Order delivered and verified. All milestones complete.";
  } else if (isDelayed) {
    currentSituation = "Shipment delayed in transit. Carrier and customer notified.";
  } else if (isShipped) {
    currentSituation = "Shipment dispatched and in transit via carrier.";
  } else if (isPaid) {
    currentSituation = "Payment verified. Awaiting fulfillment packaging.";
  }

  // 2. Important Recent Events
  const recentEvents = activities
    .filter((a) => a.activity_type === "SIGNAL_RECEIVED" || a.activity_type === "TOOL_ACTION")
    .slice(0, 3);

  // 3. Current Priority
  const currentPriority = isDelayed
    ? "Resolve carrier transit delay & reassure customer"
    : isDelivered
    ? "Lifecycle fulfilled"
    : "Maintain proactive SLA tracking and verify next milestone";

  // 4. Customer Context
  const customerName = currentState.customer_name || "Valued Customer";
  const customerTier = currentState.priority === "high" || currentState.priority === "urgent" ? "VIP Priority Tier" : "Standard Tier";

  // 5. Active Instructions
  const activeInstructions = run.extra_instructions
    ? run.extra_instructions
    : "Standard Guardian SLA: Escalate any payment or carrier delays proactively.";

  // 6. Next Expected Action
  let nextExpectedAction = "Await next event signal or scheduled checkpoint";
  if (run.next_wakeup_at && run.status === "SLEEPING") {
    nextExpectedAction = `Scheduled check at ${parseUtcDate(run.next_wakeup_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (isDelivered) {
    nextExpectedAction = "No further actions required.";
  }

  // 7. Last Memory Update
  const lastMemoryUpdate = parseUtcDate(run.updated_at || run.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              AI Working Memory
            </h3>
            <span className="text-[10px] text-slate-500">
              Live operational context maintained across sleeps
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <span>Synchronized</span>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="space-y-3">
        {/* 1. Current Situation */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Zap className="h-3 w-3 text-indigo-600" />
            <span>Current Situation</span>
          </div>
          <p className="text-xs font-semibold text-slate-900 leading-snug">{currentSituation}</p>
        </div>

        {/* 2. Important Recent Events */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Important Recent Events</span>
          </div>
          {recentEvents.length > 0 ? (
            <div className="space-y-1">
              {recentEvents.map((evt) => (
                <div key={evt.id} className="flex items-center justify-between text-[11px] text-slate-700">
                  <span className="truncate max-w-[210px] font-medium">• {evt.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {parseUtcDate(evt.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No events recorded yet.</p>
          )}
        </div>

        {/* 3. Current Priority & 4. Customer Context in 2 Cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Current Priority */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <Target className="h-3 w-3 text-emerald-600" />
              <span>Current Priority</span>
            </div>
            <p className="text-xs font-medium text-slate-800 leading-snug">{currentPriority}</p>
          </div>

          {/* Customer Context */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <User className="h-3 w-3 text-indigo-600" />
              <span>Customer Context</span>
            </div>
            <p className="text-xs font-semibold text-slate-900 truncate">{customerName}</p>
            <span className="text-[10px] text-slate-500 font-medium block truncate">{customerTier}</span>
          </div>
        </div>

        {/* 5. Active Instructions */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3 text-teal-600" />
            <span>Active Instructions</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans">{activeInstructions}</p>
        </div>

        {/* 6. Next Expected Action & 7. Last Memory Update */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Next Expected Action
            </span>
            <p className="text-xs font-medium text-slate-800 truncate">{nextExpectedAction}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Last Memory Update
            </span>
            <p className="text-xs font-mono font-medium text-slate-700">{lastMemoryUpdate}</p>
          </div>
        </div>
      </div>

      {/* Expandable Full Compact Memory Text */}
      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={() => setShowRawMemory(!showRawMemory)}
          className="flex items-center justify-between w-full text-[11px] text-slate-600 hover:text-slate-900 transition"
        >
          <span className="flex items-center gap-1 font-medium">
            {showRawMemory ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            View Full Working Memory String
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {run.compact_memory ? `${run.compact_memory.length} chars` : "Default"}
          </span>
        </button>

        {showRawMemory && (
          <div className="mt-2 p-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono leading-relaxed whitespace-pre-wrap">
            {run.compact_memory || "Context initialized."}
          </div>
        )}
      </div>
    </div>
  );
};

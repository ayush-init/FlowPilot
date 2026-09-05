"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Truck,
  User,
  Package,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { OrderRun } from "../lib/types";

interface AIMemoryPanelProps {
  run: OrderRun;
}

export const AIMemoryPanel: React.FC<AIMemoryPanelProps> = ({ run }) => {
  const [showRawMemory, setShowRawMemory] = useState(false);

  const currentState = run.current_state || {};
  const activities = run.activities || [];

  const orderStatus = currentState.order_status || (run.status === "COMPLETED" ? "Delivered" : "In Progress");
  const paymentStatus = currentState.payment_status || (activities.some(a => a.metadata_json?.event_type === "payment_confirmed") ? "Settled & Verified" : "Pending Confirmation");
  const shipmentStatus = currentState.shipment_status || (activities.some(a => a.metadata_json?.event_type === "delivered") ? "Delivered" : activities.some(a => a.metadata_json?.event_type === "shipment_delayed") ? "Delayed in Transit" : activities.some(a => a.metadata_json?.event_type === "shipment_created") ? "Shipped / In Transit" : "Awaiting Fulfillment");
  const customerName = currentState.customer_name || "Customer";
  const customerTier = currentState.priority === "high" || currentState.priority === "urgent" ? "VIP Priority Account" : "Standard Account";
  const trackingNumber = currentState.tracking_id || (activities.find(a => a.metadata_json?.payload?.tracking_id)?.metadata_json?.payload?.tracking_id) || "FedEx TRK-99214";

  const recentEvents = activities
    .filter((a) => a.activity_type === "SIGNAL_RECEIVED" || a.activity_type === "TOOL_ACTION")
    .slice(0, 3);

  const activePriorities = run.extra_instructions
    ? run.extra_instructions
    : "Standard SLA supervision: Ensure timely transit updates and proactive customer reassurance.";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Operational State Memory
            </h3>
            <span className="text-[10px] text-slate-500">
              Compact real-time context representation
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <span>Synchronized</span>
        </div>
      </div>

      {/* Structured Status Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Payment Status */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <CreditCard className="h-3 w-3 text-indigo-600" />
            <span>Payment</span>
          </div>
          <p className="text-xs font-semibold text-slate-900 truncate">{paymentStatus}</p>
        </div>

        {/* Shipment Status */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <Truck className="h-3 w-3 text-blue-600" />
            <span>Logistics</span>
          </div>
          <p className="text-xs font-semibold text-slate-900 truncate">{shipmentStatus}</p>
        </div>

        {/* Customer Context */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <User className="h-3 w-3 text-indigo-600" />
            <span>Customer</span>
          </div>
          <p className="text-xs font-semibold text-slate-900 truncate">{customerName}</p>
          <span className="text-[9px] text-slate-500 font-medium block truncate">{customerTier}</span>
        </div>

        {/* Tracking */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <Package className="h-3 w-3 text-amber-600" />
            <span>Tracking ID</span>
          </div>
          <p className="text-xs font-mono text-slate-800 truncate">{trackingNumber}</p>
        </div>
      </div>

      {/* Active Guidance & Priorities */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-150 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            Active Order Directives
          </span>
          <span className="text-indigo-600 font-semibold lowercase">active</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-sans">{activePriorities}</p>
      </div>

      {/* Recent Important Milestones */}
      {recentEvents.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Recent Order Milestones
          </div>
          <div className="space-y-1">
            {recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-[11px]"
              >
                <span className="text-slate-800 font-medium truncate max-w-[200px]">{evt.title}</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(evt.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Full Compact Memory String */}
      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={() => setShowRawMemory(!showRawMemory)}
          className="flex items-center justify-between w-full text-[11px] text-slate-600 hover:text-slate-900 transition"
        >
          <span className="flex items-center gap-1 font-medium">
            {showRawMemory ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            View Full Working Memory Text
          </span>
          <span className="text-[10px] text-slate-400">
            Updated {new Date(run.updated_at || run.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

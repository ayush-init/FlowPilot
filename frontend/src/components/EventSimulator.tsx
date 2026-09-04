"use client";

import React, { useState } from "react";
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Truck,
  MessageSquare,
  PackageCheck,
  RotateCcw,
  ClockAlert,
  Send,
  Sparkles,
} from "lucide-react";
import { EventTemplate } from "../lib/types";
import { sendEventSignal } from "../lib/api";

interface EventSimulatorProps {
  runId: string;
  isTerminal: boolean;
  onEventSent: () => void;
}

const DEFAULT_EVENTS: EventTemplate[] = [
  {
    event_type: "payment_confirmed",
    category: "Payment",
    description: "Payment gateway settled charge.",
    payload: { transaction_id: "TXN-88492", status: "settled", amount: 189.99 },
  },
  {
    event_type: "payment_failed",
    category: "Payment Error",
    description: "Card processor declined payment transaction.",
    payload: { error_code: "insufficient_funds", retry_attempt: 2 },
  },
  {
    event_type: "shipment_created",
    category: "Logistics",
    description: "Warehouse printed label and packed parcel.",
    payload: { carrier: "FedEx Ground", tracking_id: "TRK-99214-US" },
  },
  {
    event_type: "shipment_delayed",
    category: "Logistics Delay",
    description: "Carrier reported blizzard transit delay.",
    payload: { reason: "Midwest blizzard delay", expected_delay_hours: 48, tracking_id: "TRK-99214-US" },
  },
  {
    event_type: "customer_message_received",
    category: "Customer Support",
    description: "Customer sent status inquiry.",
    payload: { message: "Where is my keyboard package? It has been 3 days.", channel: "email" },
  },
  {
    event_type: "refund_requested",
    category: "Support Exception",
    description: "Customer initiated full order refund.",
    payload: { reason: "Ordered incorrect model", amount: 189.99 },
  },
  {
    event_type: "no_update_for_n_hours",
    category: "Logistics Stalled",
    description: "No scan recorded by carrier for 36 hours.",
    payload: { hours_since_last_scan: 36, last_facility: "Chicago Hub" },
  },
  {
    event_type: "delivered",
    category: "Terminal Delivery",
    description: "Carrier confirmed front porch delivery.",
    payload: { delivered_at: new Date().toISOString(), signed_by: "Front Porch" },
  },
];

export const EventSimulator: React.FC<EventSimulatorProps> = ({
  runId,
  isTerminal,
  onEventSent,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<EventTemplate | null>(null);
  const [customPayload, setCustomPayload] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSelectEvent = (event: EventTemplate) => {
    setSelectedEvent(event);
    setCustomPayload(JSON.stringify(event.payload, null, 2));
  };

  const handleSendSignal = async (template?: EventTemplate) => {
    const target = template || selectedEvent;
    if (!target || isTerminal) return;

    setLoading(true);
    setFeedback(null);
    try {
      let parsedPayload = target.payload;
      if (!template && customPayload) {
        try {
          parsedPayload = JSON.parse(customPayload);
        } catch {
          // fallback to default
        }
      }

      await sendEventSignal(runId, target.event_type, parsedPayload, target.description);
      setFeedback(`Signal '${target.event_type}' dispatched into Temporal!`);
      setSelectedEvent(null);
      onEventSent();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "payment_confirmed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "payment_failed":
        return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      case "shipment_created":
        return <Truck className="h-4 w-4 text-indigo-400" />;
      case "shipment_delayed":
        return <ClockAlert className="h-4 w-4 text-amber-400" />;
      case "customer_message_received":
        return <MessageSquare className="h-4 w-4 text-sky-400" />;
      case "refund_requested":
        return <RotateCcw className="h-4 w-4 text-rose-400" />;
      case "no_update_for_n_hours":
        return <ClockAlert className="h-4 w-4 text-orange-400" />;
      case "delivered":
        return <PackageCheck className="h-4 w-4 text-emerald-400" />;
      default:
        return <Zap className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Lifecycle Event Simulator
          </h3>
        </div>
        <span className="text-[10px] text-slate-400">1-Click Signal Dispatch</span>
      </div>

      {feedback && (
        <div className="p-2.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Quick Event Buttons Grid */}
      <div className="grid grid-cols-2 gap-2">
        {DEFAULT_EVENTS.map((event) => (
          <button
            key={event.event_type}
            disabled={isTerminal || loading}
            onClick={() => handleSelectEvent(event)}
            className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
              selectedEvent?.event_type === event.event_type
                ? "bg-indigo-600/20 border-indigo-500/60 ring-1 ring-indigo-500/40"
                : "bg-slate-800/40 hover:bg-slate-800 border-slate-700/50"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className="p-1.5 rounded-lg bg-slate-900/80 mt-0.5">{getIcon(event.event_type)}</div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{event.event_type}</div>
              <div className="text-[10px] text-slate-400 truncate">{event.category}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Payload Customizer Modal/Drawer if event selected */}
      {selectedEvent && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300">
              Payload for {selectedEvent.event_type}
            </span>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <textarea
            rows={3}
            value={customPayload}
            onChange={(e) => setCustomPayload(e.target.value)}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleSendSignal()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              <span>{loading ? "Dispatching..." : "Send Signal into Workflow"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

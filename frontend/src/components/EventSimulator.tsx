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
  Play,
  Sliders,
  X,
} from "lucide-react";
import { EventTemplate } from "../lib/types";
import { sendEventSignal } from "../lib/api";

interface EventSimulatorProps {
  runId: string;
  isTerminal: boolean;
  onEventSent: () => void;
}

const SIMULATOR_EVENTS: EventTemplate[] = [
  {
    event_type: "payment_confirmed",
    category: "Payment Flow",
    description: "Payment gateway settled full charge without fraud flags.",
    payload: { transaction_id: "TXN-884920", status: "settled", amount: 189.99, gateway: "Stripe" },
  },
  {
    event_type: "payment_failed",
    category: "Payment Exception",
    description: "Card processor declined payment transaction due to insufficient funds.",
    payload: { error_code: "insufficient_funds", retry_attempt: 2, amount: 189.99 },
  },
  {
    event_type: "shipment_created",
    category: "Fulfillment",
    description: "Warehouse printed label and packaged parcel for carrier pickup.",
    payload: { carrier: "FedEx Ground", tracking_id: "TRK-FEDEX-99214", origin: "Memphis Hub" },
  },
  {
    event_type: "shipment_delayed",
    category: "Logistics Delay",
    description: "Carrier reported severe snowstorm transit delay in sorting hub.",
    payload: { reason: "Midwest blizzard sorting delay", expected_delay_hours: 48, tracking_id: "TRK-FEDEX-99214" },
  },
  {
    event_type: "customer_message_received",
    category: "Customer Support",
    description: "Customer sent status inquiry via support portal.",
    payload: { message: "Where is my keyboard order? I need it before Friday for a tournament.", channel: "email" },
  },
  {
    event_type: "refund_requested",
    category: "Support Exception",
    description: "Customer initiated full refund request through self-service portal.",
    payload: { reason: "Customer ordered wrong color/model", requested_amount: 189.99 },
  },
  {
    event_type: "no_update_for_n_hours",
    category: "Carrier Stalled",
    description: "Carrier tracking telemetry has not reported a scan in 36 hours.",
    payload: { hours_since_last_scan: 36, last_location: "Indianapolis Hub" },
  },
  {
    event_type: "delivered",
    category: "Delivery (Terminal)",
    description: "Carrier confirmed front porch delivery with timestamp.",
    payload: { delivered_at: new Date().toISOString(), signed_by: "Front Door Porch", tracking_id: "TRK-FEDEX-99214" },
  },
];

export const EventSimulator: React.FC<EventSimulatorProps> = ({
  runId,
  isTerminal,
  onEventSent,
}) => {
  const [activeEvent, setActiveEvent] = useState<EventTemplate | null>(null);
  const [customPayload, setCustomPayload] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sendingEventType, setSendingEventType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    lifecycleStage: string;
  } | null>(null);

  const handleOpenCustomize = (event: EventTemplate) => {
    setActiveEvent(event);
    setCustomPayload(JSON.stringify(event.payload, null, 2));
  };

  const handleQuickDispatch = async (template: EventTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isTerminal || loading) return;

    setSendingEventType(template.event_type);
    setLoading(true);
    setFeedback(null);

    try {
      await sendEventSignal(
        runId,
        template.event_type,
        template.payload,
        template.description
      );

      setFeedback({
        type: "success",
        message: `Signal '${template.event_type}' injected successfully.`,
        lifecycleStage: `Signal Received → Supervisor Woke Up → Context Evaluated`,
      });

      onEventSent();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: `Failed to send event: ${err.message}`,
        lifecycleStage: "Signal dispatch error",
      });
    } finally {
      setLoading(false);
      setSendingEventType(null);
    }
  };

  const handleCustomDispatch = async () => {
    if (!activeEvent || isTerminal || loading) return;

    setLoading(true);
    setSendingEventType(activeEvent.event_type);

    let parsedPayload = activeEvent.payload;
    try {
      parsedPayload = JSON.parse(customPayload);
    } catch {
      // fallback
    }

    try {
      await sendEventSignal(
        runId,
        activeEvent.event_type,
        parsedPayload,
        activeEvent.description
      );

      setFeedback({
        type: "success",
        message: `Signal '${activeEvent.event_type}' dispatched with custom parameters.`,
        lifecycleStage: "Signal Received → Supervisor Evaluating Workflow Context",
      });

      setActiveEvent(null);
      onEventSent();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: `Error: ${err.message}`,
        lifecycleStage: "Signal dispatch error",
      });
    } finally {
      setLoading(false);
      setSendingEventType(null);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "payment_confirmed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "payment_failed":
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case "shipment_created":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "shipment_delayed":
        return <ClockAlert className="h-4 w-4 text-amber-600" />;
      case "customer_message_received":
        return <MessageSquare className="h-4 w-4 text-indigo-600" />;
      case "refund_requested":
        return <RotateCcw className="h-4 w-4 text-rose-600" />;
      case "no_update_for_n_hours":
        return <ClockAlert className="h-4 w-4 text-orange-600" />;
      case "delivered":
        return <PackageCheck className="h-4 w-4 text-emerald-600" />;
      default:
        return <Zap className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Lifecycle Event Simulator
            </h3>
            <span className="text-[10px] text-slate-500">
              Inject external order signals to test supervisor reaction
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {isTerminal ? "Workflow Completed" : "Interactive Testing"}
        </span>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs space-y-1 transition-all ${
            feedback.type === "success"
              ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
              : "bg-rose-50/70 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
            <span>{feedback.message}</span>
          </div>
          <div className="text-[11px] text-indigo-700 font-mono pl-5">
            {feedback.lifecycleStage}
          </div>
        </div>
      )}

      {/* Grid of 8 Lifecycle Event Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SIMULATOR_EVENTS.map((event) => {
          const isSendingThis = sendingEventType === event.event_type;

          return (
            <div
              key={event.event_type}
              className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                isTerminal
                  ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                  : "bg-white hover:bg-slate-50/70 border-slate-200 hover:border-slate-300 shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-50 border border-slate-200">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900 truncate">
                      {event.event_type}
                    </div>
                    <div className="text-[10px] text-slate-500">{event.category}</div>
                  </div>
                </div>

                {/* Edit Payload Button */}
                <button
                  onClick={() => handleOpenCustomize(event)}
                  disabled={isTerminal || loading}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                  title="Customize payload parameters before sending"
                >
                  <Sliders className="h-3 w-3" />
                </button>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug line-clamp-2 mb-2.5">
                {event.description}
              </p>

              {/* Quick Dispatch Button */}
              <button
                onClick={(e) => handleQuickDispatch(event, e)}
                disabled={isTerminal || loading}
                className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition border ${
                  isSendingThis
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white border-slate-200 hover:border-indigo-600"
                } disabled:opacity-40 disabled:cursor-not-allowed shadow-xs`}
              >
                {isSendingThis ? (
                  <>
                    <Zap className="h-3 w-3 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    <span>Send Signal</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payload Customizer Drawer / Modal */}
      {activeEvent && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3 mt-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-3.5 w-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900">
                Customize Signal Payload: <span className="font-mono text-indigo-600">{activeEvent.event_type}</span>
              </span>
            </div>
            <button
              onClick={() => setActiveEvent(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600">{activeEvent.description}</p>

          <textarea
            rows={4}
            value={customPayload}
            onChange={(e) => setCustomPayload(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setActiveEvent(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomDispatch}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-xs disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              <span>{loading ? "Sending Signal..." : "Dispatch to Workflow"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

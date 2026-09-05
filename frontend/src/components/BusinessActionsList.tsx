"use client";

import React, { useState } from "react";
import {
  Wrench,
  Truck,
  CreditCard,
  Package,
  MessageSquare,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { RunActivity, parseUtcDate } from "../lib/types";

interface BusinessActionsListProps {
  activities: RunActivity[];
}

export const BusinessActionsList: React.FC<BusinessActionsListProps> = ({ activities }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toolActivities = activities.filter((a) => a.activity_type === "TOOL_ACTION");

  const getActionConfig = (title: string, metadata: Record<string, any>) => {
    const rawName = metadata.name || title.replace(/^Action:\s*/, "");

    switch (rawName) {
      case "message_fulfillment_team":
        return {
          icon: <Package className="h-4 w-4 text-amber-600" />,
          label: "Fulfillment Team Alert",
          target: "Warehouse Dispatch",
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "message_payments_team":
        return {
          icon: <CreditCard className="h-4 w-4 text-rose-600" />,
          label: "Payments & Billing Alert",
          target: "Finance Operations",
          badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
        };
      case "message_logistics_team":
        return {
          icon: <Truck className="h-4 w-4 text-blue-600" />,
          label: "Logistics Carrier Escalation",
          target: "Carrier Dispatch",
          badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
        };
      case "message_customer":
        return {
          icon: <MessageSquare className="h-4 w-4 text-emerald-600" />,
          label: "Customer Communication",
          target: "End Customer",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "create_internal_note":
      default:
        return {
          icon: <FileText className="h-4 w-4 text-indigo-600" />,
          label: "Internal Audit Log",
          target: "Audit Log",
          badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
        };
    }
  };

  if (toolActivities.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-center shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-left">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Executed Business Actions (0)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Automated operations</span>
        </div>
        <p className="text-xs text-slate-500 py-3">
          No automated interventions triggered yet. The supervisor will execute logistics, customer, or warehouse actions when events require intervention.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-slate-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Executed Business Actions ({toolActivities.length})
          </h3>
        </div>
        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Delivered
        </span>
      </div>

      <div className="space-y-2.5">
        {toolActivities.map((act) => {
          const config = getActionConfig(act.title, act.metadata_json);
          const args = act.metadata_json?.args || act.metadata_json || {};
          const isExpanded = expandedId === act.id;
          const messageText = args.message || args.content || act.content;
          const subject = args.subject || args.action_required || args.issue_type;

          return (
            <div
              key={act.id}
              className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-white border border-slate-200 shadow-xs">
                    {config.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {config.label}
                      </span>
                      <span
                        className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border ${config.badgeColor}`}
                      >
                        {config.target}
                      </span>
                    </div>
                    {subject && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Subject: <span className="text-slate-800 font-medium">{subject}</span>
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                  {parseUtcDate(act.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>

              {/* Message snippet */}
              <div className="text-xs text-slate-800 bg-white p-2.5 rounded border border-slate-200 leading-relaxed font-sans">
                {messageText}
              </div>

              {/* Collapsible raw parameters toggle */}
              <div className="flex justify-end">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : act.id)}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 font-mono transition"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <span>{isExpanded ? "Hide Payload Data" : "Inspect Payload JSON"}</span>
                </button>
              </div>

              {isExpanded && (
                <pre className="p-2.5 rounded bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto">
                  {JSON.stringify(args, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

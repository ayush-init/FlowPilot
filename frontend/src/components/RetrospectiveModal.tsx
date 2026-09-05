"use client";

import React from "react";
import { X, Award, Lightbulb, CheckCircle2, FileText } from "lucide-react";
import { OrderRun } from "../lib/types";

interface RetrospectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: OrderRun;
}

export const RetrospectiveModal: React.FC<RetrospectiveModalProps> = ({
  isOpen,
  onClose,
  run,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-slate-900">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Order #{run.order_id} Lifecycle Retrospective
              </h2>
              <p className="text-xs text-slate-500">
                AI Supervisor: {run.supervisor?.name || "Autonomous Guardian"} • Status: {run.status}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Final Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
              <FileText className="h-4 w-4" />
              <span>Comprehensive Journey Summary</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {run.final_summary ||
                "Order completed successfully. The supervisor monitored all lifecycle events, handled transit exceptions, and confirmed customer delivery."}
            </p>
          </div>

          {/* Key Learnings Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
              <Lightbulb className="h-4 w-4" />
              <span>Operational Learnings & Patterns</span>
            </div>
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {run.learnings ||
                "Carrier transit notifications were proactively handled. Proactive customer reassurance reduced inbound support ticket volume."}
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Recommendations for Fulfillment & Logistics</span>
            </div>
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {run.recommendations ||
                "Review carrier transit routing SLAs for winter storm seasons and maintain auto-reassurance triggers."}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

"use client";

import React from "react";
import { X, Award, Lightbulb, CheckCircle2, ShieldCheck, FileText } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Order #{run.order_id} End-of-Run Retrospective
              </h2>
              <p className="text-xs text-slate-400">
                Supervisor: {run.supervisor?.name || "Guardian"} • Status: {run.status}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Final Summary Card */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <FileText className="h-4 w-4" />
              <span>Comprehensive Journey Summary</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {run.final_summary || "Workflow completed successfully."}
            </p>
          </div>

          {/* Key Learnings Card */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Lightbulb className="h-4 w-4" />
              <span>Key Operational Learnings</span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {run.learnings || "Learnings compiled from order signals and tool actions."}
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Process & System Recommendations</span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {run.recommendations || "Review carrier transit routes and fulfillment dispatch SLAs."}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

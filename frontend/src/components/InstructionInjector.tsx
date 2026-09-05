"use client";

import React, { useState } from "react";
import { UserCheck, Send, CheckCircle2, History } from "lucide-react";
import { injectInstruction } from "../lib/api";
import { OrderRun, parseUtcDate } from "../lib/types";

interface InstructionInjectorProps {
  run: OrderRun;
  isTerminal: boolean;
  onInstructionSent: () => void;
}

export const InstructionInjector: React.FC<InstructionInjectorProps> = ({
  run,
  isTerminal,
  onInstructionSent,
}) => {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const instructionActivities = (run.activities || []).filter(
    (a) => a.activity_type === "OPERATOR_DIRECTIVE" || a.activity_type === "INSTRUCTION_ADDED"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isTerminal || loading) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      await injectInstruction(run.id, instruction.trim());
      setStatusMsg("Guidance applied to workflow context. Supervisor will execute policy on next cycle.");
      setInstruction("");
      onInstructionSent();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const PRESETS = [
    "Prioritize expedited reshipment over cost.",
    "Offer complimentary $25 gift card if delay exceeds 24h.",
    "VIP loyalty member: provide proactive email updates.",
    "Strict escalation: message logistics team if no scan.",
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Live Operator Directives
            </h3>
            <span className="text-[10px] text-slate-500">
              Dynamically steer workflow rules mid-execution
            </span>
          </div>
        </div>

        <span className="text-[10px] text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
          <CheckCircle2 className="h-3 w-3 text-indigo-600" />
          Live Context
        </span>
      </div>

      {statusMsg && (
        <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Preset Quick Chips */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Quick Preset Directives
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={isTerminal || loading}
              onClick={() => setInstruction(preset)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition disabled:opacity-40"
            >
              + {preset.length > 35 ? preset.substring(0, 35) + "..." : preset}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <textarea
          rows={2}
          disabled={isTerminal || loading}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Inject custom guidance (e.g. 'Customer is VIP, prioritize speed over cost')..."
          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition disabled:opacity-40"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!instruction.trim() || isTerminal || loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3 w-3" />
            <span>{loading ? "Applying..." : "Inject Directive"}</span>
          </button>
        </div>
      </form>

      {/* Guidance History */}
      {instructionActivities.length > 0 && (
        <div className="pt-2.5 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <History className="h-3 w-3" />
            <span>Guidance Log ({instructionActivities.length})</span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {instructionActivities.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-900">Operator Directive</span>
                  <span className="font-mono text-slate-500">
                    {parseUtcDate(item.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed font-sans">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

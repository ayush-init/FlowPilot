"use client";

import React, { useState } from "react";
import { UserCheck, Send, Sparkles } from "lucide-react";
import { injectInstruction } from "../lib/api";

interface InstructionInjectorProps {
  runId: string;
  isTerminal: boolean;
  onInstructionSent: () => void;
}

export const InstructionInjector: React.FC<InstructionInjectorProps> = ({
  runId,
  isTerminal,
  onInstructionSent,
}) => {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isTerminal) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      await injectInstruction(runId, instruction);
      setStatusMsg("Instruction injected into live Temporal workflow!");
      setInstruction("");
      onInstructionSent();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-violet-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Mid-Run Human Guidance
          </h3>
        </div>
        <span className="text-[10px] text-slate-400">Live Agent Steering</span>
      </div>

      {statusMsg && (
        <div className="p-2.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{statusMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          rows={2}
          disabled={isTerminal || loading}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Inject human instruction (e.g. 'Customer is VIP, prioritize expedited reshipment')..."
          className="w-full p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 disabled:opacity-40"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!instruction.trim() || isTerminal || loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3 w-3" />
            <span>{loading ? "Injecting..." : "Inject Guidance"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

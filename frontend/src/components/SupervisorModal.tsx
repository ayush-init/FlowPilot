"use client";

import React, { useState } from "react";
import { X, Bot, Shield, Zap, Moon, Plus } from "lucide-react";
import { Supervisor } from "../lib/types";
import { createSupervisor } from "../lib/api";

interface SupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisors: Supervisor[];
  onSupervisorCreated: (supervisor: Supervisor) => void;
}

export const SupervisorModal: React.FC<SupervisorModalProps> = ({
  isOpen,
  onClose,
  supervisors,
  onSupervisorCreated,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [baseInstruction, setBaseInstruction] = useState("");
  const [model, setModel] = useState("gemini-1.5-flash");
  const [aggressiveness, setAggressiveness] = useState<"low" | "balanced" | "high">("balanced");
  const [wakeupInterval, setWakeupInterval] = useState(7200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await createSupervisor({
        name,
        base_instruction: baseInstruction,
        model,
        aggressiveness,
        default_wakeup_interval_seconds: Number(wakeupInterval),
      });
      onSupervisorCreated(created);
      setIsCreating(false);
      setName("");
      setBaseInstruction("");
    } catch (err: any) {
      setError(err.message || "Failed to create supervisor template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bot className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Supervisor Personas & Templates</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!isCreating ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Available AI templates for order monitoring:</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Custom Template</span>
                </button>
              </div>

              <div className="grid gap-3">
                {supervisors.map((sup) => (
                  <div key={sup.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{sup.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                          {sup.model}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                          sup.aggressiveness === "high"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : sup.aggressiveness === "low"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {sup.aggressiveness === "high" && <Zap className="h-2.5 w-2.5" />}
                        {sup.aggressiveness === "low" && <Moon className="h-2.5 w-2.5" />}
                        {sup.aggressiveness === "balanced" && <Shield className="h-2.5 w-2.5" />}
                        {sup.aggressiveness} wake
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{sup.base_instruction}</p>
                    <div className="text-[11px] text-slate-400">
                      Default Sleep Interval: <strong className="text-slate-200">{sup.default_wakeup_interval_seconds / 60} min</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-rose-500/20 text-rose-300 text-xs border border-rose-500/30">{error}</div>}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VIP White-Glove Supervisor"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Base Instruction / Persona Prompt</label>
                <textarea
                  required
                  rows={4}
                  value={baseInstruction}
                  onChange={(e) => setBaseInstruction(e.target.value)}
                  placeholder="Explain how the AI should behave, when to contact logistics, and what tone to use..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Classifier Aggressiveness</label>
                  <select
                    value={aggressiveness}
                    onChange={(e: any) => setAggressiveness(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="balanced">Balanced (Wakes on exceptions & delays)</option>
                    <option value="high">High (Wakes on all events immediately)</option>
                    <option value="low">Low (Sleeps through routine milestones)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Scheduled Sleep (Seconds)</label>
                  <input
                    type="number"
                    min="60"
                    step="60"
                    value={wakeupInterval}
                    onChange={(e) => setWakeupInterval(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Create Template"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

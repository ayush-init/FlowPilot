"use client";

import React, { useState } from "react";
import { X, Bot, Shield, Zap, Moon, Plus, Sliders } from "lucide-react";
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
      setError(err.message || "Failed to create supervisor policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-slate-900">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Supervisor Policies & Templates</h2>
              <p className="text-xs text-slate-500">Configure order governance policies and rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {!isCreating ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {supervisors.length} active policy templates
                </span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Policy</span>
                </button>
              </div>

              <div className="grid gap-3">
                {supervisors.map((sup) => (
                  <div
                    key={sup.id}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{sup.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                          sup.aggressiveness === "high"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : sup.aggressiveness === "low"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {sup.aggressiveness === "high" && <Zap className="h-2.5 w-2.5" />}
                        {sup.aggressiveness === "low" && <Moon className="h-2.5 w-2.5" />}
                        {sup.aggressiveness === "balanced" && <Shield className="h-2.5 w-2.5" />}
                        {sup.aggressiveness} wake
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-sans">
                      {sup.base_instruction}
                    </p>

                    <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2 flex items-center justify-between">
                      <span>
                        Checkpoint Sleep Interval:{" "}
                        <strong className="text-slate-800 font-mono">
                          {sup.default_wakeup_interval_seconds / 60} min
                        </strong>
                      </span>
                      <span className="text-slate-400">
                        Created {new Date(sup.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. White-Glove VIP Policy"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base Directive & Escalation Rules
                </label>
                <textarea
                  required
                  rows={4}
                  value={baseInstruction}
                  onChange={(e) => setBaseInstruction(e.target.value)}
                  placeholder="Instruct the supervisor on escalation thresholds, tone, and resolution priorities..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wake Classifier Aggressiveness
                  </label>
                  <select
                    value={aggressiveness}
                    onChange={(e: any) => setAggressiveness(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="balanced">Balanced (Wakes on exceptions & delays)</option>
                    <option value="high">High (Wakes on all events immediately)</option>
                    <option value="low">Low (Sleeps through routine milestones)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheduled Sleep (Seconds)
                  </label>
                  <input
                    type="number"
                    min="60"
                    step="60"
                    value={wakeupInterval}
                    onChange={(e) => setWakeupInterval(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Policy Template"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

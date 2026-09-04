"use client";

import React, { useState } from "react";
import { X, Play, ShoppingBag, Bot } from "lucide-react";
import { Supervisor, OrderRun } from "../lib/types";
import { createRun } from "../lib/api";

interface CreateRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisors: Supervisor[];
  onRunCreated: (run: OrderRun) => void;
}

export const CreateRunModal: React.FC<CreateRunModalProps> = ({
  isOpen,
  onClose,
  supervisors,
  onRunCreated,
}) => {
  const [orderId, setOrderId] = useState(`ORD-${Math.floor(10000 + Math.random() * 90000)}`);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(supervisors[0]?.id || "");
  const [customerName, setCustomerName] = useState("Alex Rivers");
  const [item, setItem] = useState("Mechanical Keyboard Pro (RGB)");
  const [amount, setAmount] = useState(189.99);
  const [priority, setPriority] = useState("standard");
  const [instructions, setInstructions] = useState("Customer is a VIP loyalty tier member. Keep proactive updates frequent.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const run = await createRun({
        order_id: orderId,
        supervisor_id: selectedSupervisorId || undefined,
        order_details: {
          customer_name: customerName,
          item,
          amount: Number(amount),
          priority,
          shipping_address: "742 Evergreen Terrace, Springfield, OR",
        },
        initial_instructions: instructions || undefined,
      });
      onRunCreated(run);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to start workflow run");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Launch Order Supervisor Run</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-rose-500/20 text-rose-300 text-xs border border-rose-500/30">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Order ID</label>
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Supervisor Persona</label>
            <select
              value={selectedSupervisorId}
              onChange={(e) => setSelectedSupervisorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.aggressiveness} aggressiveness)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Ordered Item</label>
              <input
                type="text"
                required
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Amount ($ USD)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Initial Human Guidance / Rules</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Prioritize speed over cost. Offer $20 refund if delayed..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{loading ? "Starting Workflow..." : "Start Temporal Workflow"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

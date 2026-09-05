"use client";

import React, { useState } from "react";
import {
  X,
  Play,
  ShoppingBag,
  Bot,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Zap,
  Shield,
  Moon,
} from "lucide-react";
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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [orderId, setOrderId] = useState(`ORD-${Math.floor(10000 + Math.random() * 90000)}`);
  const [customerName, setCustomerName] = useState("Alex Rivers");
  const [item, setItem] = useState("Mechanical Keyboard Pro (RGB)");
  const [amount, setAmount] = useState(189.99);
  const [priority, setPriority] = useState("standard");
  const [shippingAddress, setShippingAddress] = useState("742 Evergreen Terrace, Springfield, OR");

  const [selectedSupervisorId, setSelectedSupervisorId] = useState(supervisors[0]?.id || "");
  const [instructions, setInstructions] = useState(
    "Customer is a VIP loyalty tier member. Keep proactive updates frequent and prioritize speed."
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const generateRandomOrderId = () => {
    setOrderId(`ORD-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  const selectedSupervisor =
    supervisors.find((s) => s.id === selectedSupervisorId) || supervisors[0];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) setStep((prev) => (prev + 1) as any);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as any);
  };

  const handleLaunchRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const run = await createRun({
        order_id: orderId,
        supervisor_id: selectedSupervisor?.id || undefined,
        order_details: {
          customer_name: customerName,
          item,
          amount: Number(amount),
          priority,
          shipping_address: shippingAddress,
        },
        initial_instructions: instructions || undefined,
      });

      onRunCreated(run);
      onClose();
      setStep(1);
      generateRandomOrderId();
    } catch (err: any) {
      setError(err.message || "Failed to start workflow run");
    } finally {
      setLoading(false);
    }
  };

  const GUIDANCE_PRESETS = [
    "Prioritize speed over cost for this order.",
    "VIP White-Glove: Proactively message customer if carrier tracking stalls.",
    "Cost Sensitive: Avoid expedited courier fees unless delayed over 48h.",
    "Strict Watchdog: Escalate to logistics dispatch on any route exception.",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-slate-900">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">New Order Supervisor Run</h2>
              <p className="text-xs text-slate-500">
                Step {step} of 4:{" "}
                {step === 1
                  ? "Order Details"
                  : step === 2
                  ? "Select Supervisor Policy"
                  : step === 3
                  ? "Operator Guidance"
                  : "Review & Start"}
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

        {/* Wizard Progress Bar */}
        <div className="w-full bg-slate-100 h-1 flex">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 transition-all ${
                s <= step ? "bg-indigo-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {error}
            </div>
          )}

          {/* STEP 1: Order Details */}
          {step === 1 && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={generateRandomOrderId}
                      className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs border border-slate-200 transition"
                      title="Generate random Order ID"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product / Item Description
                  </label>
                  <input
                    type="text"
                    required
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Shipping Address
                </label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Select Supervisor */}
          {step === 2 && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Select AI Supervisor Persona
              </label>

              <div className="space-y-2.5">
                {supervisors.map((s) => {
                  const isSelected = (selectedSupervisorId || supervisors[0]?.id) === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSupervisorId(s.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all text-left ${
                        isSelected
                          ? "bg-indigo-50/60 border-indigo-500 ring-1 ring-indigo-500/20 shadow-xs"
                          : "bg-white hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-indigo-600" />
                          <span className="font-bold text-xs text-slate-900">{s.name}</span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                            s.aggressiveness === "high"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : s.aggressiveness === "low"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {s.aggressiveness === "high" && <Zap className="h-2.5 w-2.5" />}
                          {s.aggressiveness === "low" && <Moon className="h-2.5 w-2.5" />}
                          {s.aggressiveness === "balanced" && <Shield className="h-2.5 w-2.5" />}
                          {s.aggressiveness} Wake
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        {s.base_instruction}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Initial Human Guidance */}
          {step === 3 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Human Guidance / Directives
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Instruct the supervisor on how to handle edge cases, VIP rules, or SLA escalation for this specific order.
                </p>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Prioritize speed over cost. If delayed, offer $20 courtesy discount..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Quick Preset Directives
                </span>
                <div className="space-y-1.5">
                  {GUIDANCE_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setInstructions(p)}
                      className="w-full p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs text-slate-700 transition"
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review Summary */}
          {step === 4 && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900">Order Information</span>
                  <span className="font-mono text-xs font-bold text-indigo-600">{orderId}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Customer:</span>
                    <span className="text-slate-900 font-semibold">{customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Amount:</span>
                    <span className="text-emerald-700 font-mono font-bold">${amount}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 text-[11px] block">Item:</span>
                    <span className="text-slate-800">{item}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900">Supervisor & Policy</span>
                  <span className="text-xs font-semibold text-indigo-600">
                    {selectedSupervisor?.name || "Guardian Policy"}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Wake Policy:</span>
                    <span className="capitalize">{selectedSupervisor?.aggressiveness || "balanced"}</span>
                  </div>
                  <div className="pt-1 text-slate-500 text-[11px]">
                    Guidance: <span className="text-slate-800 font-sans italic">"{instructions || 'None'}"</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
            >
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunchRun}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{loading ? "Starting Workflow..." : "Start Workflow"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

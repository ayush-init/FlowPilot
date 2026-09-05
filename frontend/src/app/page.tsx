"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  Package,
  Boxes,
  Clock,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Supervisor, OrderRun } from "../lib/types";
import { fetchSupervisors, fetchRuns } from "../lib/api";
import { Navbar } from "../components/Navbar";
import { RunCard } from "../components/RunCard";
import { RunDetail } from "../components/RunDetail";
import { CreateRunModal } from "../components/CreateRunModal";
import { SupervisorModal } from "../components/SupervisorModal";

export default function DashboardPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [runs, setRuns] = useState<OrderRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateRunOpen, setIsCreateRunOpen] = useState(false);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);

  const loadAll = async () => {
    try {
      const [sups, runsData] = await Promise.all([
        fetchSupervisors(),
        fetchRuns(filterStatus === "all" ? undefined : filterStatus),
      ]);
      setSupervisors(sups);
      setRuns((prevRuns) => {
        const prevJson = JSON.stringify(prevRuns.map((r) => ({ id: r.id, status: r.status, updated_at: r.updated_at })));
        const newJson = JSON.stringify(runsData.map((r) => ({ id: r.id, status: r.status, updated_at: r.updated_at })));
        if (prevJson === newJson) {
          return prevRuns;
        }
        return runsData;
      });
      setSelectedRunId((prev) => {
        if (prev && runsData.some((r) => r.id === prev)) {
          return prev;
        }
        return runsData.length > 0 ? runsData[0].id : null;
      });
    } catch (err) {
      console.error("Failed loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const timer = setInterval(loadAll, 4000);
    return () => clearInterval(timer);
  }, [filterStatus]);

  const filteredRuns = runs.filter((r) => {
    const q = searchQuery.toLowerCase();
    const orderIdMatch = r.order_id.toLowerCase().includes(q);
    const customerMatch = (r.current_state?.customer_name || "").toLowerCase().includes(q);
    const itemMatch = (r.current_state?.item || "").toLowerCase().includes(q);
    return orderIdMatch || customerMatch || itemMatch;
  });

  const activeRunsCount = runs.filter(
    (r) => r.status === "RUNNING" || r.status === "SLEEPING" || r.status === "PAUSED"
  ).length;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Navbar
        onOpenCreateRun={() => setIsCreateRunOpen(true)}
        onOpenSupervisors={() => setIsSupervisorModalOpen(true)}
        activeRunsCount={activeRunsCount}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANE: Order Runs Navigator */}
        <aside className="w-80 md:w-88 xl:w-96 border-r border-slate-200 bg-white flex flex-col h-full flex-shrink-0 shadow-xs">
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-slate-50/50">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by order, customer, item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-xs transition"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs overflow-x-auto">
              {["all", "RUNNING", "SLEEPING", "PAUSED", "COMPLETED"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`flex-1 py-1 px-2 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                    filterStatus === tab
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab === "all" ? "All" : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Runs Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/30">
            {loading && runs.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-600" />
                <p>Loading active order runs...</p>
              </div>
            ) : filteredRuns.length === 0 ? (
              <div className="py-16 px-4 text-center space-y-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">No active workflows</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Start a new order supervisor run to begin monitoring an order lifecycle.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateRunOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  New Order Run
                </button>
              </div>
            ) : (
              filteredRuns.map((run) => (
                <RunCard
                  key={run.id}
                  run={run}
                  isSelected={selectedRunId === run.id}
                  onSelect={() => setSelectedRunId(run.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* CENTER & RIGHT STAGE: Selected Run Inspector */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
          {selectedRunId ? (
            <RunDetail
              key={selectedRunId}
              runId={selectedRunId}
              onRefreshList={loadAll}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <Boxes className="h-7 w-7" />
              </div>

              <div className="max-w-md space-y-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Autonomous Order Operations
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Start an order supervisor workflow, simulate lifecycle events, inject live operator guidance, and observe durable sleep and automated decisions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full text-left">
                {[
                  {
                    icon: Clock,
                    title: "Durable Sleep & Wake",
                    desc: "Workflow sleeps durably in Temporal and wakes on signals or schedules.",
                  },
                  {
                    icon: Layers,
                    title: "Working Memory",
                    desc: "Continuous state compaction maintains clear context across long orders.",
                  },
                  {
                    icon: Zap,
                    title: "Automated Actions",
                    desc: "Executes fulfillment, logistics, customer, and payments actions.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-xs"
                  >
                    <item.icon className="h-4 w-4 text-indigo-600" />
                    <div className="text-xs font-bold text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsCreateRunOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                <Plus className="h-4 w-4" />
                <span>Launch New Order Run</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateRunModal
        isOpen={isCreateRunOpen}
        onClose={() => setIsCreateRunOpen(false)}
        supervisors={supervisors}
        onRunCreated={(newRun) => {
          setSelectedRunId(newRun.id);
          loadAll();
        }}
      />

      <SupervisorModal
        isOpen={isSupervisorModalOpen}
        onClose={() => setIsSupervisorModalOpen(false)}
        supervisors={supervisors}
        onSupervisorCreated={(newSup) => {
          setSupervisors((prev) => [...prev, newSup]);
        }}
      />
    </div>
  );
}

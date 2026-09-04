"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Package,
  Layers,
  Sparkles,
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
      setRuns(runsData);
      if (!selectedRunId && runsData.length > 0) {
        setSelectedRunId(runsData[0].id);
      }
    } catch (err) {
      console.error("Failed loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const timer = setInterval(loadAll, 5000);
    return () => clearInterval(timer);
  }, [filterStatus]);

  const filteredRuns = runs.filter((r) => {
    const matchesSearch =
      r.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.current_state?.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.current_state?.item?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const activeRunsCount = runs.filter(
    (r) => r.status === "RUNNING" || r.status === "SLEEPING" || r.status === "PAUSED"
  ).length;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        onOpenCreateRun={() => setIsCreateRunOpen(true)}
        onOpenSupervisors={() => setIsSupervisorModalOpen(true)}
        activeRunsCount={activeRunsCount}
      />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Runs List */}
        <aside className="w-80 md:w-96 border-r border-slate-800/80 bg-slate-900/40 flex flex-col h-full">
          {/* Search & Filter Header */}
          <div className="p-4 border-b border-slate-800/80 space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800/70 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-slate-950/60 border border-slate-800 rounded-lg text-xs">
              {["all", "RUNNING", "SLEEPING", "COMPLETED"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`flex-1 py-1 rounded-md text-[11px] font-medium capitalize transition ${
                    filterStatus === tab
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "all" ? "All" : tab.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Runs Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {loading && runs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-400" />
                Loading runs...
              </div>
            ) : filteredRuns.length === 0 ? (
              <div className="py-16 px-4 text-center space-y-3">
                <Package className="h-10 w-10 text-slate-600 mx-auto" />
                <div>
                  <p className="text-xs font-semibold text-slate-300">No order runs found</p>
                  <p className="text-[11px] text-slate-500 mt-1">Launch your first AI order supervisor</p>
                </div>
                <button
                  onClick={() => setIsCreateRunOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium rounded-lg border border-indigo-500/30 transition"
                >
                  Start New Run
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

        {/* Right Main Stage: Run Inspector / Detail View */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/80">
          {selectedRunId ? (
            <RunDetail
              runId={selectedRunId}
              onRefreshList={loadAll}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl">
                <Bot className="h-8 w-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h2 className="text-lg font-bold text-white">FlowPilot Order Supervisor</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select an active order run from the sidebar or start a new supervisor run to monitor end-to-end fulfillment, dispatch event signals, and inspect Gemini tool actions.
                </p>
              </div>
              <button
                onClick={() => setIsCreateRunOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Launch Order Run</span>
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

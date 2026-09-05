"use client";

import React, { useState, useEffect } from "react";
import { Supervisor, OrderRun } from "../lib/types";
import { fetchSupervisors, fetchRuns } from "../lib/api";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { LoginView } from "../components/LoginView";
import { Sidebar, NavTab } from "../components/Sidebar";
import { TopNav } from "../components/TopNav";
import { DashboardView } from "../components/DashboardView";
import { OrderRunsTable } from "../components/OrderRunsTable";
import { RunDetail } from "../components/RunDetail";
import { TemplatesView } from "../components/TemplatesView";
import { ActivityView } from "../components/ActivityView";
import { AnalyticsView } from "../components/AnalyticsView";
import { CreateRunModal } from "../components/CreateRunModal";
import { SupervisorModal } from "../components/SupervisorModal";
import { Boxes, RefreshCw } from "lucide-react";

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [runs, setRuns] = useState<OrderRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateRunOpen, setIsCreateRunOpen] = useState(false);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);

  const loadAll = async () => {
    if (!user) return;
    try {
      const [sups, runsData] = await Promise.all([
        fetchSupervisors(),
        fetchRuns(),
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
    } catch (err) {
      console.error("Failed loading application state", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAll();
      const timer = setInterval(loadAll, 3000);
      return () => clearInterval(timer);
    }
  }, [user]);

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white mx-auto shadow-xs">
            <Boxes className="h-5 w-5 text-indigo-400" />
          </div>
          <p className="text-xs font-mono font-medium text-slate-500 flex items-center gap-2 justify-center">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
            Verifying FlowPilot session...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated -> Render Login View
  if (!user) {
    return <LoginView />;
  }

  // Authenticated Handlers
  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    setCurrentTab("runs");
  };

  const handleNavigateRuns = (filter?: string) => {
    setSelectedRunId(null);
    setCurrentTab("runs");
  };

  const handleTabChange = (tab: NavTab) => {
    if (tab === "runs" && currentTab === "runs" && selectedRunId) {
      setSelectedRunId(null);
    }
    setCurrentTab(tab);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* 1. Global Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        runsCount={runs.length}
      />

      {/* 2. Main Application Body */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Global Top Bar */}
        <TopNav
          onOpenCreateRun={() => setIsCreateRunOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* View Router */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
          {currentTab === "dashboard" && (
            <DashboardView
              runs={runs}
              supervisors={supervisors}
              onSelectRun={handleSelectRun}
              onNavigateRuns={handleNavigateRuns}
              onOpenCreateRun={() => setIsCreateRunOpen(true)}
            />
          )}

          {currentTab === "runs" && (
            selectedRunId ? (
              <RunDetail
                key={selectedRunId}
                runId={selectedRunId}
                onBack={() => setSelectedRunId(null)}
                onRefreshList={loadAll}
              />
            ) : (
              <OrderRunsTable
                runs={runs}
                supervisors={supervisors}
                selectedRunId={selectedRunId}
                onSelectRun={handleSelectRun}
                onOpenCreateRun={() => setIsCreateRunOpen(true)}
                onRefresh={loadAll}
                loading={loading}
              />
            )
          )}

          {currentTab === "templates" && (
            <TemplatesView
              supervisors={supervisors}
              onOpenCreateSupervisor={() => setIsSupervisorModalOpen(true)}
            />
          )}

          {currentTab === "activity" && (
            <ActivityView
              runs={runs}
              onSelectRun={handleSelectRun}
            />
          )}

          {currentTab === "analytics" && (
            <AnalyticsView runs={runs} />
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
          setCurrentTab("runs");
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

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

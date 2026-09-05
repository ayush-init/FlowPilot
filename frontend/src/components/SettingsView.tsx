"use client";

import React from "react";
import {
  Settings,
  Workflow,
  Database,
  Cpu,
  Key,
  CheckCircle2,
  Shield,
  Server,
  Zap,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-900 p-5 lg:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Settings & Engine Runtime
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Temporal workflow runtime, database connection, AI engine parameters, and operator authentication.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temporal Runtime */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Workflow className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Temporal Workflow Engine
              </h3>
              <span className="text-[10px] text-slate-500">Durable execution backend</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Connection Host:</span>
              <span className="font-mono font-bold text-slate-900">localhost:7233</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Task Queue:</span>
              <span className="font-mono font-bold text-slate-900">order-supervisor-queue</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Namespace:</span>
              <span className="font-mono font-bold text-slate-900">default</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Deterministic Replay:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Postgres Database
              </h3>
              <span className="text-[10px] text-slate-500">Persistent working context & audit trail</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Database Engine:</span>
              <span className="font-mono font-bold text-slate-900">Neon Serverless PostgreSQL</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Connection Status:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">SSL Mode:</span>
              <span className="font-mono font-bold text-slate-900">require</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Pooler:</span>
              <span className="font-mono font-bold text-slate-900">aws-neon-pooler</span>
            </div>
          </div>
        </div>

        {/* AI Supervisor Model Engine */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                AI Reasoning Engine
              </h3>
              <span className="text-[10px] text-slate-500">Autonomous evaluation & compaction</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Primary Model:</span>
              <span className="font-mono font-bold text-slate-900">Gemini 2.5 Pro (Autonomous)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Context Window:</span>
              <span className="font-mono font-bold text-slate-900">1,000,000 Tokens</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Tool Dispatch:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Structured Function Calling
              </span>
            </div>
          </div>
        </div>

        {/* Security & Operator Role */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Operator Security & Role
              </h3>
              <span className="text-[10px] text-slate-500">Live human-in-the-loop override</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Current Operator:</span>
              <span className="font-bold text-slate-900">Ayush Sharma</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Role:</span>
              <span className="font-mono font-bold text-indigo-700">Lead Operations Supervisor</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Directive Injection:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Authorized
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

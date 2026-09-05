"use client";

import React from "react";
import {
  LayoutDashboard,
  Layers,
  SlidersHorizontal,
  Activity,
  BarChart3,
  Settings,
  Boxes,
  Workflow,
  Database,
  Cpu,
} from "lucide-react";

export type NavTab = "dashboard" | "runs" | "templates" | "activity" | "analytics" | "settings";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  runsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  runsCount,
}) => {
  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "runs" as NavTab, label: "Order Runs", icon: Layers, badge: runsCount },
    { id: "templates" as NavTab, label: "Templates", icon: SlidersHorizontal },
    { id: "activity" as NavTab, label: "Activity", icon: Activity },
    { id: "analytics" as NavTab, label: "Analytics", icon: BarChart3 },
    { id: "settings" as NavTab, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-60 xl:w-64 border-r border-slate-200 bg-white flex flex-col h-full flex-shrink-0 justify-between select-none shadow-xs">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-150 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
              FlowPilot AI
            </h1>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-1 block">
              Autonomous Order Ops
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Telemetry Card */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>System Telemetry</span>
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="space-y-1.5 text-[11px] text-slate-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Workflow className="h-3 w-3 text-slate-400" />
              Temporal
            </span>
            <span className="text-emerald-700 font-medium flex items-center gap-1 text-[10px]">
              <span className="h-1 w-1 rounded-full bg-emerald-500" /> Connected
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3 text-slate-400" />
              Database
            </span>
            <span className="text-emerald-700 font-medium flex items-center gap-1 text-[10px]">
              <span className="h-1 w-1 rounded-full bg-emerald-500" /> Connected
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-slate-400" />
              AI Engine
            </span>
            <span className="text-emerald-700 font-medium flex items-center gap-1 text-[10px]">
              <span className="h-1 w-1 rounded-full bg-emerald-500" /> Connected
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

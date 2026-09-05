"use client";

import React from "react";
import {
  LayoutDashboard,
  Layers,
  SlidersHorizontal,
  Activity,
  BarChart3,
  Boxes,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export type NavTab = "dashboard" | "runs" | "templates" | "activity" | "analytics";

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
  const { user, logout } = useAuth();

  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "runs" as NavTab, label: "Order Runs", icon: Layers, badge: runsCount },
    { id: "templates" as NavTab, label: "Templates", icon: SlidersHorizontal },
    { id: "activity" as NavTab, label: "Activity", icon: Activity },
    { id: "analytics" as NavTab, label: "Analytics", icon: BarChart3 },
  ];

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return "AC";
  };

  const displayName = user?.name || "Ayush Chaurasiya";
  const displayEmail = user?.email || "ayushchaurasiya9532951470@gmail.com";
  const initials = getInitials(user?.name, user?.email);

  return (
    <aside className="w-60 xl:w-64 border-r border-slate-200 bg-white flex flex-col h-full flex-shrink-0 justify-between select-none shadow-xs">
      {/* Brand Header & Navigation */}
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

      {/* Bottom User Card & Sign Out */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-mono">
                {displayEmail}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition flex-shrink-0"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

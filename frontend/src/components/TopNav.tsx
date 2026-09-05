"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface TopNavProps {
  onOpenCreateRun: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenCreateRun,
  searchQuery,
  onSearchChange,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30 px-5 py-2.5 flex items-center justify-between text-slate-900 shadow-xs">
      {/* Global Search */}
      <div className="relative w-72 sm:w-96 max-w-lg">
        <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search orders, customers, workflows..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-12 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-xs transition"
        />
        <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 rounded bg-slate-200 border border-slate-300 text-[10px] font-mono text-slate-500">
          ⌘K
        </kbd>
      </div>

      {/* Right Action Icons & User */}
      <div className="flex items-center gap-3">
        {/* Cluster / Runtime Environment */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Production</span>
          <span className="text-slate-300">•</span>
          <span>us-east-1</span>
        </div>

        {/* Notifications */}
        <button
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
          title="Theme Toggle"
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Primary CTA */}
        <button
          onClick={onOpenCreateRun}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Order Run</span>
        </button>

        {/* User Profile Avatar with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition focus:outline-none"
          >
            <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              AS
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">Ayush Sharma</p>
                <p className="text-[11px] text-slate-500">ayush@flowpilot.ai</p>
              </div>
              <button
                onClick={() => setShowUserMenu(false)}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
              >
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Operator Profile</span>
              </button>
              <button
                onClick={() => setShowUserMenu(false)}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-rose-600 flex items-center gap-2 border-t border-slate-100"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

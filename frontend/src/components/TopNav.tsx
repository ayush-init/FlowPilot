"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return "OP";
  };

  const displayName = user?.name || "Operator";
  const displayEmail = user?.email || "operator@flowpilot.ai";
  const initials = getInitials(user?.name, user?.email);

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
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-100 transition focus:outline-none"
            title={displayName}
          >
            <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold shadow-xs tracking-wider">
              {initials}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{displayName}</p>
                <p className="text-[11px] text-slate-500 truncate">{displayEmail}</p>
                <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                  {user?.auth_provider || "email"} session
                </span>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition"
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

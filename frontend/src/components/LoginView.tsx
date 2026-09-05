"use client";

import React, { useState } from "react";
import { Boxes, ArrowRight, AlertCircle, Mail, Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LoginView: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), name.trim() || undefined);
    } catch (err: any) {
      setLocalError(err.message || "Failed to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-slate-900 items-center justify-center text-white shadow-xs mb-1">
            <Boxes className="h-6 w-6 text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            FlowPilot AI
          </h1>
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Autonomous AI Order Operations
          </p>
          <p className="text-xs text-slate-500 pt-1">
            Sign in to manage autonomous order workflows.
          </p>
        </div>

        {/* Error Alert */}
        {activeError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Authentication Error</span>
              <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">{activeError}</p>
            </div>
          </div>
        )}

        {/* Action 1: Google OAuth */}
        <div className="space-y-3">
          <button
            onClick={loginWithGoogle}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider relative">
            or
          </span>
        </div>

        {/* Action 2: Email Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
              Work Email
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="ayush@flowpilot.ai"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (activeError) clearError();
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
              Operator Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Ayush Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-300" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Continue with Email</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Support Text */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-mono">
            POC Session Authentication • Temporal Deterministic Fleet
          </p>
        </div>
      </div>
    </div>
  );
};

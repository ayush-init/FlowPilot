import { Supervisor, OrderRun, EventTemplate, SystemHealth, User } from "./types";

// Normalize API base URL to ensure trailing /api is always present
const rawBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").trim().replace(/\/+$/, "");
export const API_BASE = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("flowpilot_token");
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("flowpilot_token", token);
  } else {
    localStorage.removeItem("flowpilot_token");
  }
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      cache: "no-store",
      credentials: "include",
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.authenticated ? data.user : null;
  } catch {
    return null;
  }
}

export async function loginWithEmail(email: string, name?: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, name }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Authentication failed. Please check your credentials.");
  }
  const data = await res.json();
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function fetchGoogleAuthUrl(): Promise<{ configured: boolean; url: string | null }> {
  try {
    const res = await fetch(`${API_BASE}/auth/google/url`, {
      cache: "no-store",
      credentials: "include",
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { configured: false, url: null };
    return res.json();
  } catch {
    return { configured: false, url: null };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error("Logout error", err);
  } finally {
    setStoredToken(null);
  }
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  try {
    const res = await fetch(`${API_BASE}/system/health`, {
      cache: "no-store",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Health check returned bad status");
    return await res.json();
  } catch (err: any) {
    return {
      status: "degraded",
      app: "FlowPilot Backend",
      env: "development",
      temporal: {
        status: "offline",
        host: "localhost:7233",
        namespace: "default",
        task_queue: "flowpilot-order-supervisor-queue",
        detail: "FlowPilot running with built-in resilient local supervisor.",
      },
      database: {
        status: "degraded",
        detail: err.message || "Database connection error",
      },
      ai: {
        status: "heuristic_fallback",
        provider: "Autonomous AI Engine",
        model: "Gemini 2.5 Pro",
        detail: "Running on autonomous supervisor engine",
      },
    };
  }
}

export async function fetchSupervisors(): Promise<Supervisor[]> {
  const res = await fetch(`${API_BASE}/supervisors`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch supervisors");
  return res.json();
}

export async function createSupervisor(data: Partial<Supervisor>): Promise<Supervisor> {
  const res = await fetch(`${API_BASE}/supervisors`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to create supervisor");
  }
  return res.json();
}

export async function fetchRuns(status?: string): Promise<OrderRun[]> {
  const url = status && status !== "all" ? `${API_BASE}/runs?status=${status}` : `${API_BASE}/runs`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch runs");
  return res.json();
}

export async function fetchRunDetail(runId: string): Promise<OrderRun> {
  const res = await fetch(`${API_BASE}/runs/${runId}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch run ${runId}`);
  return res.json();
}

export const fetchRun = fetchRunDetail;

export async function createRun(payload: {
  order_id: string;
  supervisor_id?: string;
  order_details: Record<string, any>;
  initial_instructions?: string;
}): Promise<OrderRun> {
  const res = await fetch(`${API_BASE}/runs`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to launch run");
  }
  return res.json();
}

export async function sendEventSignal(
  runId: string,
  event_type: string,
  payload: Record<string, any> = {},
  description: string = ""
): Promise<any> {
  const res = await fetch(`${API_BASE}/runs/${runId}/events`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ event_type, payload, description }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to send event signal");
  }
  return res.json();
}

export async function injectInstruction(runId: string, instruction: string): Promise<any> {
  const res = await fetch(`${API_BASE}/runs/${runId}/instructions`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ instruction }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to inject instruction");
  }
  return res.json();
}

export async function pauseRun(runId: string, reason?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/runs/${runId}/pause`, {
    method: "POST",
    headers: getAuthHeaders(reason ? { "Content-Type": "application/json" } : {}),
    body: reason ? JSON.stringify({ reason }) : undefined,
  });
  if (!res.ok) throw new Error("Failed to pause run");
  return res.json();
}

export async function resumeRun(runId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/runs/${runId}/resume`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to resume run");
  return res.json();
}

export async function terminateRun(runId: string, reason: string = "Manual termination"): Promise<any> {
  const res = await fetch(`${API_BASE}/runs/${runId}/terminate`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error("Failed to terminate run");
  return res.json();
}

export async function fetchEventTemplates(): Promise<EventTemplate[]> {
  const res = await fetch(`${API_BASE}/simulator/events`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch event templates");
  const data = await res.json();
  return data.templates;
}

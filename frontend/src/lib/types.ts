export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  auth_provider: "email" | "google";
  created_at?: string;
  updated_at?: string;
}

export interface Supervisor {
  id: string;
  name: string;
  base_instruction: string;
  description?: string;
  allowed_tools?: string[];
  model: string;
  aggressiveness: "low" | "balanced" | "high";
  default_wakeup_interval_seconds: number;
  created_at: string;
}

export type ActivityType =
  | "WORKFLOW_START"
  | "SIGNAL_RECEIVED"
  | "AI_WAKE"
  | "WAKE_DECISION"
  | "AGENT_REASONING"
  | "AI_DECISION"
  | "TOOL_ACTION"
  | "MEMORY_UPDATE"
  | "SLEEP_STARTED"
  | "INSTRUCTION_ADDED"
  | "OPERATOR_DIRECTIVE"
  | "WORKFLOW_STATE_CHANGE"
  | "WORKFLOW_PAUSED"
  | "WORKFLOW_RESUMED"
  | "WORKFLOW_COMPLETED"
  | "WORKFLOW_TERMINATED"
  | "FINAL_RETROSPECTIVE";

export interface RunActivity {
  id: string;
  run_id: string;
  activity_type: ActivityType;
  title: string;
  content: string;
  metadata_json: Record<string, any>;
  created_at: string;
}

export type SupervisorWorkflowStatus =
  | "INITIALIZING"
  | "RUNNING"
  | "THINKING"
  | "ACTION_REQUIRED"
  | "SLEEPING"
  | "PAUSED"
  | "COMPLETED"
  | "TERMINATED";

export interface OrderRun {
  id: string;
  order_id: string;
  supervisor_id: string | null;
  temporal_workflow_id: string;
  status: "INITIALIZING" | "RUNNING" | "SLEEPING" | "PAUSED" | "COMPLETED" | "TERMINATED";
  compact_memory: string;
  current_state: Record<string, any>;
  extra_instructions: string;
  next_wakeup_at: string | null;
  final_summary: string | null;
  learnings: string | null;
  recommendations: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  supervisor?: Supervisor;
  activities?: RunActivity[];
}

export interface EventTemplate {
  event_type: string;
  category: string;
  description: string;
  payload: Record<string, any>;
}

export interface SystemHealth {
  status: "healthy" | "degraded";
  app: string;
  env: string;
  temporal: {
    status: "connected" | "offline";
    host: string;
    namespace: string;
    task_queue: string;
    detail: string;
  };
  database: {
    status: "healthy" | "degraded";
    detail: string;
  };
  ai: {
    status: "configured" | "heuristic_fallback";
    provider: string;
    model: string;
    detail: string;
  };
}

export interface StructuredAIDecision {
  trigger: string;
  decision: "intervene" | "monitor_and_sleep" | "initialize" | "complete";
  reason: string;
  actionExecuted?: string;
  actionPayload?: Record<string, any>;
  nextWakeup: string;
  timestamp: string;
}

export function parseUtcDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  if (typeof dateStr !== "string") return new Date(dateStr);
  if (!dateStr.endsWith("Z") && !dateStr.includes("+") && !dateStr.includes("-", 10)) {
    return new Date(dateStr + "Z");
  }
  return new Date(dateStr);
}


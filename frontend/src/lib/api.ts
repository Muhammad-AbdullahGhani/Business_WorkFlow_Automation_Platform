import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export type Workflow = {
  id: string;
  name: string;
  description: string;
  category: "Finance" | "Sales & Marketing" | "Customer Support" | "HR" | "Operations" | string;
  trigger: string;
  trigger_type: "webhook" | "email" | "stripe" | "form" | "cron" | "manual" | string;
  status: "active" | "draft" | "paused";
  runs_today: number;
  total_runs: number;
  success_rate: number;
  time_saved_mins: number;
  graph_json: string;
};

export type WorkflowRun = {
  id: string;
  workflow_id: string;
  status: "success" | "failed" | "running";
  duration_ms: number;
  time_saved_mins: number;
  trace: string[];
  analytics: string;
  context: string;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown>;
  created_at: string;
};

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: string;
  trigger_type: string;
  nodes: string[];
  time_saved_mins: number;
};

export type AnalyticsStats = {
  total_workflows: number;
  active_workflows: number;
  runs_today: number;
  all_time_runs: number;
  total_time_saved_hours: number;
  avg_success_rate: number;
  chart_data: Array<{
    day: string;
    runs: number;
    time_saved_hrs: number;
    success_rate: number;
  }>;
  category_distribution: Array<{
    category: string;
    count: number;
  }>;
};

export const workflowApi = {
  list: (params?: { status?: string; category?: string; search?: string }) =>
    api.get<Workflow[]>("/workflows", { params }).then((r) => r.data),

  get: (id: string) => api.get<Workflow>(`/workflows/${id}`).then((r) => r.data),

  createFromPrompt: (prompt: string, provider: string = "auto", apiKey?: string) =>
    api
      .post<Workflow>("/workflows/create-from-prompt", {
        prompt,
        provider,
        api_key: apiKey || undefined,
      })
      .then((r) => r.data),

  createManual: (data: { name: string; description: string; category?: string; trigger: string; trigger_type?: string; nodes?: string[] }) =>
    api.post<Workflow>("/workflows", data).then((r) => r.data),

  update: (id: string, data: Partial<Workflow>) =>
    api.put<Workflow>(`/workflows/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ status: string; message: string }>(`/workflows/${id}`).then((r) => r.data),

  duplicate: (id: string) =>
    api.post<Workflow>(`/workflows/${id}/duplicate`).then((r) => r.data),

  updateGraph: (id: string, nodes: string[]) =>
    api.put<Workflow>(`/workflows/${id}/graph`, { nodes }).then((r) => r.data),

  runTest: (id: string, inputPayload?: Record<string, unknown>) =>
    api
      .post<{
        workflow_id: string;
        run_id: string;
        status: string;
        duration_ms: number;
        time_saved_mins: number;
        trace: string[];
        analytics: string;
        context: string;
        output_payload: Record<string, unknown>;
      }>(`/workflows/${id}/run-test`, { input_payload: inputPayload })
      .then((r) => r.data),

  getRuns: (id: string, limit: number = 10) =>
    api.get<WorkflowRun[]>(`/workflows/${id}/runs`, { params: { limit } }).then((r) => r.data),

  listTemplates: () =>
    api.get<WorkflowTemplate[]>("/workflows/templates/list").then((r) => r.data),

  cloneTemplate: (templateId: string) =>
    api.post<Workflow>(`/workflows/templates/${templateId}/clone`).then((r) => r.data),

  getStats: () => api.get<AnalyticsStats>("/analytics/stats").then((r) => r.data),

  getHealth: () => api.get<{ status: string; database: string; llm_provider: string }>("/health").then((r) => r.data),
};


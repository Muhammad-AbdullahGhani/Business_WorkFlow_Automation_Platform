"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Layers,
  LayoutGrid,
  Mail,
  MessageSquare,
  Play,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Workflow as WorkflowIcon,
  X,
  Zap,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AnalyticsStats,
  Workflow,
  WorkflowRun,
  WorkflowTemplate,
  workflowApi,
} from "@/lib/api";

const NODE_CATALOG: Record<
  string,
  { name: string; category: "trigger" | "ai" | "integration" | "logic" | "analytics"; description: string; icon: any; color: string }
> = {
  webhook_trigger: {
    name: "Webhook Trigger",
    category: "trigger",
    description: "Ingests HTTP webhook payload from external SaaS apps",
    icon: Zap,
    color: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  },
  email_received: {
    name: "Email Inbox Trigger",
    category: "trigger",
    description: "Monitors inbox and parses subject and attachments",
    icon: Mail,
    color: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  },
  form_submitted: {
    name: "Form Submission",
    category: "trigger",
    description: "Captures lead forms, Typeform, or survey submissions",
    icon: FileText,
    color: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  },
  stripe_action: {
    name: "Stripe Event / Billing",
    category: "integration",
    description: "Processes payment events, creates invoices or charges",
    icon: ShieldCheck,
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  document_intelligence: {
    name: "Document OCR & Extraction",
    category: "ai",
    description: "AI extracts line items, totals, and fields from PDF/docs",
    icon: FileText,
    color: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  },
  rag_knowledge_search: {
    name: "RAG Vector Knowledge Search",
    category: "ai",
    description: "Retrieves company policies, FAQs, and documentation chunks",
    icon: Layers,
    color: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  },
  ai_summarizer: {
    name: "AI Summary & Action Items",
    category: "ai",
    description: "Distills data into bullet points and key decisions",
    icon: Bot,
    color: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  },
  ai_sentiment_classifier: {
    name: "AI Sentiment & Urgency",
    category: "ai",
    description: "Scores customer sentiment, urgency, and routing priority",
    icon: Sparkles,
    color: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  },
  ai_data_extractor: {
    name: "AI Entity & Lead Scorer",
    category: "ai",
    description: "Extracts contact information, company tier, and qualification",
    icon: Bot,
    color: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  },
  ai_decision_gate: {
    name: "AI Decision Gate / Router",
    category: "logic",
    description: "Evaluates condition rules and branches execution flow",
    icon: Sliders,
    color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
  send_slack_alert: {
    name: "Slack Alert Dispatcher",
    category: "integration",
    description: "Sends interactive alert card to designated Slack channel",
    icon: MessageSquare,
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  send_email_action: {
    name: "Automated Email Sender",
    category: "integration",
    description: "Sends personalized email to customer or team member",
    icon: Mail,
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  send_whatsapp_message: {
    name: "WhatsApp Notification",
    category: "integration",
    description: "Delivers WhatsApp template alert or SMS message",
    icon: MessageSquare,
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  analytics: {
    name: "ROI & Impact Analytics",
    category: "analytics",
    description: "Computes human time saved, audit trace, and performance metrics",
    icon: BarChart3,
    color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  },
};

const PROMPT_SUGGESTIONS = [
  "After Stripe payment, extract invoice PDF and alert finance in Slack",
  "Triage support emails, classify sentiment, and draft AI response",
  "Qualify inbound demo form leads, score company, and notify sales rep",
  "Handle Stripe failed payment: send AI dunning email and WhatsApp alert",
  "Monitor negative customer reviews and escalate urgent issues to support",
];

export function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [builderNodes, setBuilderNodes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft" | "paused">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals & Panels
  const [showBuilder, setShowBuilder] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    workflow_id: string;
    run_id: string;
    status: string;
    duration_ms: number;
    time_saved_mins: number;
    trace: string[];
    analytics: string;
    context: string;
    output_payload: Record<string, unknown>;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Settings state
  const [selectedProvider, setSelectedProvider] = useState<string>("auto");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [systemHealth, setSystemHealth] = useState<{ database: string; llm_provider: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function loadData() {
    try {
      const [wfs, st, tpls, health] = await Promise.all([
        workflowApi.list(),
        workflowApi.getStats().catch(() => null),
        workflowApi.listTemplates().catch(() => []),
        workflowApi.getHealth().catch(() => null),
      ]);
      setWorkflows(wfs);
      if (st) setStats(st);
      if (tpls) setTemplates(tpls);
      if (health) setSystemHealth(health);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((wf) => {
      const matchesTab = activeTab === "all" || wf.status === activeTab;
      const matchesCat = categoryFilter === "all" || wf.category === categoryFilter;
      const matchesSearch =
        !searchQuery ||
        wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wf.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wf.trigger.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesCat && matchesSearch;
    });
  }, [workflows, activeTab, categoryFilter, searchQuery]);

  async function handleCreateFromPrompt(customPrompt?: string) {
    const text = customPrompt || prompt;
    if (!text.trim()) return;
    setLoading(true);
    try {
      const newWf = await workflowApi.createFromPrompt(text, selectedProvider, apiKeyInput);
      setPrompt("");
      showToast(`Workflow "${newWf.name}" generated successfully!`);
      await loadData();
      openBuilder(newWf);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to generate workflow. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCloneTemplate(templateId: string) {
    try {
      const newWf = await workflowApi.cloneTemplate(templateId);
      setShowTemplatesModal(false);
      showToast(`Template "${newWf.name}" cloned into active workflows!`);
      await loadData();
      openBuilder(newWf);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to clone template");
    }
  }

  function openBuilder(wf: Workflow) {
    setSelectedWorkflow(wf);
    try {
      const parsed = JSON.parse(wf.graph_json || "[]");
      const list = Array.isArray(parsed) ? parsed : [];
      setBuilderNodes(list.map((node, idx) => `${String(node)}::${idx}-${Date.now()}`));
    } catch {
      setBuilderNodes([]);
    }
    setShowBuilder(true);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = builderNodes.findIndex((item) => item === String(active.id));
    const newIndex = builderNodes.findIndex((item) => item === String(over.id));
    if (oldIndex >= 0 && newIndex >= 0) {
      setBuilderNodes((items) => arrayMove(items, oldIndex, newIndex));
    }
  }

  function addNodeToBuilder(nodeKey: string) {
    setBuilderNodes((prev) => [...prev, `${nodeKey}::${Date.now()}-${Math.random().toString(36).substring(7)}`]);
  }

  function removeNodeFromBuilder(nodeId: string) {
    setBuilderNodes((prev) => prev.filter((n) => n !== nodeId));
  }

  async function handleSaveGraph() {
    if (!selectedWorkflow) return;
    const cleanNodes = builderNodes.map((n) => n.split("::")[0]);
    try {
      const updated = await workflowApi.updateGraph(selectedWorkflow.id, cleanNodes);
      setSelectedWorkflow(updated);
      showToast("Workflow graph saved successfully!");
      await loadData();
    } catch {
      showToast("Failed to save workflow graph");
    }
  }

  async function handleRunTest(wf: Workflow) {
    setIsExecuting(true);
    setShowExecutionModal(true);
    setExecutionResult(null);
    try {
      const res = await workflowApi.runTest(wf.id);
      setExecutionResult(res);
      await loadData();
    } catch (err: any) {
      showToast("Pipeline test failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsExecuting(false);
    }
  }

  async function handleToggleStatus(wf: Workflow) {
    const nextStatus = wf.status === "active" ? "paused" : "active";
    try {
      await workflowApi.update(wf.id, { status: nextStatus });
      showToast(`Workflow status updated to ${nextStatus}`);
      await loadData();
    } catch {
      showToast("Failed to update status");
    }
  }

  async function handleDuplicate(wf: Workflow) {
    try {
      const duplicated = await workflowApi.duplicate(wf.id);
      showToast(`Duplicated as "${duplicated.name}"`);
      await loadData();
    } catch {
      showToast("Failed to duplicate workflow");
    }
  }

  async function handleDelete(wf: Workflow) {
    if (!confirm(`Are you sure you want to delete "${wf.name}"?`)) return;
    try {
      await workflowApi.delete(wf.id);
      showToast(`Workflow deleted`);
      if (selectedWorkflow?.id === wf.id) {
        setShowBuilder(false);
        setSelectedWorkflow(null);
      }
      await loadData();
    } catch {
      showToast("Failed to delete workflow");
    }
  }

  // Calculated Stats
  const totalRuns = stats?.runs_today ?? workflows.reduce((sum, w) => sum + w.runs_today, 0);
  const totalWorkflowsCount = workflows.length;
  const activeWorkflowsCount = workflows.filter((w) => w.status === "active").length;
  const totalHoursSaved = stats?.total_time_saved_hours ?? Math.round(workflows.reduce((s, w) => s + w.time_saved_mins * Math.max(1, w.total_runs), 0) / 60);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-slate-900/95 px-4 py-3 text-sm text-cyan-200 shadow-2xl shadow-cyan-950/50 backdrop-blur">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
              <WorkflowIcon className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">SmartFlow AI</span>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Business Workflow Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Status Pill */}
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">
                DB: <strong className="font-mono text-emerald-300">{systemHealth?.database || "SQLite"}</strong>
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">
                AI: <strong className="font-mono text-cyan-300">{selectedProvider.toUpperCase()}</strong>
              </span>
            </div>

            <button
              onClick={() => setShowTemplatesModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
              Templates
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              API Settings
            </button>

            <button
              onClick={() => {
                const draftWf: Workflow = {
                  id: `wf_${Date.now().toString(36)}`,
                  name: "New Custom Automation",
                  description: "Manual custom workflow builder",
                  category: "Operations",
                  trigger: "HTTP Webhook received",
                  trigger_type: "webhook",
                  status: "draft",
                  runs_today: 0,
                  total_runs: 0,
                  success_rate: 100,
                  time_saved_mins: 20,
                  graph_json: JSON.stringify(["webhook_trigger", "ai_summarizer", "send_slack_alert", "analytics"]),
                };
                openBuilder(draftWf);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-cyan-500/20 transition hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              New Flow
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* AI Prompt Generator Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <Sparkles className="h-4 w-4" />
              AI Prompt to Full Workflow Engine
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Describe your business automation in natural language
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              SmartFlow automatically configures triggers, AI extraction nodes, RAG lookups, and third-party dispatches.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFromPrompt()}
                  placeholder="e.g. When a new customer signs up, extract data, verify in CRM, and send onboarding Slack alert..."
                  className="w-full rounded-xl border border-white/15 bg-slate-900/90 px-4 py-3.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <button
                onClick={() => handleCreateFromPrompt()}
                disabled={loading || !prompt.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3.5 text-sm font-semibold text-black shadow-lg shadow-cyan-500/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" />
                    Generate Flow
                  </>
                )}
              </button>
            </div>

            {/* Quick Chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Suggested:</span>
              {PROMPT_SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(sug);
                    handleCreateFromPrompt(sug);
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-200"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Metric KPI Cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">AI Tasks Today</span>
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <Bot className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-white">{totalRuns}</span>
              <span className="text-xs font-medium text-emerald-400">+24% vs yesterday</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Workflows</span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <PlayCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-white">{activeWorkflowsCount}</span>
              <span className="text-xs text-slate-400">of {totalWorkflowsCount} total</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Hours Saved (SMBs)</span>
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-white">{totalHoursSaved}h</span>
              <span className="text-xs font-medium text-purple-400">~${totalHoursSaved * 45} ROI</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Execution Success Rate</span>
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-white">99.4%</span>
              <span className="text-xs font-medium text-emerald-400">0 errors</span>
            </div>
          </div>
        </section>

        {/* Analytics Execution Trend Chart */}
        {stats?.chart_data && stats.chart_data.length > 0 && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-xl backdrop-blur">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-semibold text-white">Automation Execution & Time Savings Trend</h3>
                <p className="text-xs text-slate-400">Daily LangGraph pipeline throughput and labor reduction</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Runs
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400" /> Hours Saved
                </span>
              </div>
            </div>
            <div className="mt-4 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chart_data}>
                  <defs>
                    <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="runs" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorRuns)" />
                  <Area type="monotone" dataKey="time_saved_hrs" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Workflows Management Section */}
        <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Your Automation Pipelines</h3>
              <p className="text-xs text-slate-400">Manage, test, and edit your active workflows</p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workflows..."
                  className="rounded-lg border border-white/10 bg-slate-900/80 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
                {(["all", "active", "draft", "paused"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-3 py-1 font-medium capitalize transition ${
                      activeTab === tab ? "bg-cyan-500 text-black shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Workflow Cards Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWorkflows.map((wf) => {
              let nodeCount = 4;
              try {
                const parsed = JSON.parse(wf.graph_json || "[]");
                if (Array.isArray(parsed)) nodeCount = parsed.length;
              } catch {}

              return (
                <article
                  key={wf.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg transition hover:border-cyan-500/40 hover:bg-white/[0.05]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                          {wf.category}
                        </span>
                        <h4 className="mt-2 text-base font-semibold text-white group-hover:text-cyan-300 transition">
                          {wf.name}
                        </h4>
                      </div>
                      <button
                        onClick={() => handleToggleStatus(wf)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition ${
                          wf.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                            : wf.status === "paused"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                            : "bg-slate-500/20 text-slate-300 border border-slate-500/30 hover:bg-slate-500/30"
                        }`}
                      >
                        {wf.status}
                      </button>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs text-slate-300">{wf.description}</p>

                    <div className="mt-4 space-y-1.5 rounded-xl border border-white/5 bg-black/20 p-3 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Trigger:</span>
                        <span className="font-medium text-slate-200 truncate max-w-[170px]">{wf.trigger}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Nodes:</span>
                        <span className="font-mono text-cyan-300">{nodeCount} LangGraph steps</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Runs Today:</span>
                        <span className="font-semibold text-white">{wf.runs_today}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRunTest(wf)}
                        className="flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500 hover:text-black"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Run Test
                      </button>

                      <button
                        onClick={() => openBuilder(wf)}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                      >
                        <Sliders className="h-3 w-3" />
                        Builder
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicate(wf)}
                        title="Duplicate Flow"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(wf)}
                        title="Delete Flow"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredWorkflows.length === 0 && (
            <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-12 text-center">
              <Bot className="h-10 w-10 text-slate-500" />
              <h4 className="mt-3 text-base font-semibold text-white">No workflows match this filter</h4>
              <p className="mt-1 text-xs text-slate-400">Generate a new one with AI prompt or choose from templates.</p>
              <button
                onClick={() => setShowTemplatesModal(true)}
                className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-black"
              >
                Explore Templates
              </button>
            </div>
          )}
        </section>
      </main>

      {/* ========================================================
          VISUAL DRAG & DROP WORKFLOW BUILDER MODAL
      ======================================================== */}
      {showBuilder && selectedWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-white/15 bg-slate-950 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedWorkflow.name}</h3>
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                    Visual Builder
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedWorkflow.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveGraph}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-emerald-400"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Save Graph
                </button>
                <button
                  onClick={() => handleRunTest(selectedWorkflow)}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-cyan-400"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run Pipeline
                </button>
                <button
                  onClick={() => setShowBuilder(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Builder Body */}
            <div className="grid flex-1 grid-cols-1 md:grid-cols-3 overflow-hidden">
              {/* Left Node Library Palette */}
              <div className="border-r border-white/10 bg-slate-900/50 p-4 overflow-y-auto max-h-[65vh]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Node Library</h4>
                <p className="mt-1 text-[11px] text-slate-500">Click a node to add it to the state machine</p>

                <div className="mt-4 space-y-2">
                  {Object.entries(NODE_CATALOG).map(([key, item]) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => addNodeToBuilder(key)}
                        className={`w-full text-left rounded-xl border p-2.5 transition hover:scale-[1.02] ${item.color}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-xs font-semibold">{item.name}</span>
                        </div>
                        <p className="mt-1 text-[10px] opacity-80">{item.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Canvas: Drag and Drop Sortable Pipeline */}
              <div className="col-span-2 p-6 overflow-y-auto max-h-[65vh] bg-black/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Execution Flow Sequence ({builderNodes.length} steps)
                  </span>
                  <span className="text-[11px] text-slate-500">Drag items to reorder LangGraph nodes</span>
                </div>

                <div className="mt-4">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={builderNodes} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {builderNodes.map((nodeId, idx) => {
                          const nodeKey = nodeId.split("::")[0];
                          const nodeMeta = NODE_CATALOG[nodeKey] || {
                            name: nodeKey,
                            category: "logic",
                            description: "Custom execution step",
                            icon: Bot,
                            color: "border-slate-500/40 bg-slate-500/10 text-slate-300",
                          };
                          return (
                            <SortableNodeItem
                              key={nodeId}
                              id={nodeId}
                              stepIndex={idx + 1}
                              nodeMeta={nodeMeta}
                              onRemove={() => removeNodeFromBuilder(nodeId)}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {builderNodes.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">
                      Pipeline is empty. Add nodes from the library on the left.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          LIVE EXECUTION TRACE MODAL
      ======================================================== */}
      {showExecutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-white/15 bg-slate-950 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">LangGraph Execution Engine</h3>
              </div>
              <button
                onClick={() => setShowExecutionModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {isExecuting && (
                <div className="flex flex-col items-center justify-center py-10">
                  <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin" />
                  <p className="mt-4 text-sm font-semibold text-white">Executing state graph transitions...</p>
                  <p className="text-xs text-slate-400">Orchestrating agent state machine</p>
                </div>
              )}

              {executionResult && (
                <>
                  {/* Summary Banner */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-200">Execution Successful</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-mono text-slate-300">Duration: {executionResult.duration_ms}ms</span>
                        <span className="font-semibold text-cyan-300">+{executionResult.time_saved_mins} mins saved</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-emerald-300/80">{executionResult.analytics}</p>
                  </div>

                  {/* Step Trace */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Step Trace Execution</h4>
                    <div className="mt-3 space-y-2">
                      {executionResult.trace.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-900/70 p-3 text-xs"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                            {idx + 1}
                          </span>
                          <span className="text-slate-200 font-mono">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Output JSON Payload Inspector */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Output Payload</h4>
                    <pre className="mt-2 rounded-xl border border-white/10 bg-black/40 p-4 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                      {JSON.stringify(executionResult.output_payload, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PRE-BUILT TEMPLATES GALLERY MODAL
      ======================================================== */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-white/15 bg-slate-950 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">Pre-Built Automation Templates</h3>
                <p className="text-xs text-slate-400">Enterprise workflows ready for 1-click deployment</p>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] grid gap-4 sm:grid-cols-2">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-500/40 transition"
                >
                  <div>
                    <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                      {tpl.category}
                    </span>
                    <h4 className="mt-2 text-base font-semibold text-white">{tpl.name}</h4>
                    <p className="mt-1 text-xs text-slate-300">{tpl.description}</p>
                    <p className="mt-3 text-[11px] text-slate-400">
                      Trigger: <strong className="text-slate-200">{tpl.trigger}</strong>
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[11px] font-medium text-emerald-400">~{tpl.time_saved_mins} mins saved/run</span>
                    <button
                      onClick={() => handleCloneTemplate(tpl.id)}
                      className="flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-cyan-400"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          API & PROVIDER SETTINGS MODAL
      ======================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative flex w-full max-w-lg flex-col rounded-3xl border border-white/15 bg-slate-950 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">AI Provider & API Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300">LLM Provider Mode</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-cyan-400"
                >
                  <option value="auto">Auto (Groq / Gemini / Local / Fallback)</option>
                  <option value="groq">Groq Cloud (Free Llama 3.3 70B)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                  <option value="gemini">Google Gemini 2.0</option>
                  <option value="local">Local Ollama (localhost:11434)</option>
                  <option value="fallback">Intelligent Rule Engine (Zero-dep Offline)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300">API Key (Optional for Cloud LLM)</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="gsk_... or sk-..."
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Tip: Free API keys can be generated at{" "}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 underline"
                  >
                    console.groq.com
                  </a>
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                <p className="font-semibold text-white">Current Backend Diagnostics</p>
                <p className="text-slate-300">
                  Database: <strong className="font-mono text-emerald-300">{systemHealth?.database || "SQLite (Active)"}</strong>
                </p>
                <p className="text-slate-300">
                  Backend API: <strong className="font-mono text-cyan-300">http://localhost:8000</strong>
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  showToast("Settings applied!");
                }}
                className="rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-cyan-400 transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableNodeItem({
  id,
  stepIndex,
  nodeMeta,
  onRemove,
}: {
  id: string;
  stepIndex: number;
  nodeMeta: { name: string; description: string; icon: any; color: string };
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const Icon = nodeMeta.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between rounded-xl border p-3.5 transition shadow-sm ${nodeMeta.color}`}
    >
      <div className="flex items-center gap-3 cursor-grab active:cursor-grabbing flex-1" {...attributes} {...listeners}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-[11px] font-bold">
          {stepIndex}
        </span>
        <Icon className="h-4 w-4 shrink-0" />
        <div>
          <h5 className="text-xs font-bold leading-tight">{nodeMeta.name}</h5>
          <p className="text-[10px] opacity-75">{nodeMeta.description}</p>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="rounded-lg p-1 text-slate-400 opacity-60 hover:opacity-100 hover:text-rose-400 transition ml-2"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

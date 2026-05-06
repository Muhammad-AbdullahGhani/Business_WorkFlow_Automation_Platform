"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Bot, PlayCircle, Sparkles } from "lucide-react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api, Workflow } from "@/lib/api";

const statCards = [
  { label: "AI Tasks Today", icon: Bot, color: "text-cyan-300" },
  { label: "Active Workflows", icon: PlayCircle, color: "text-emerald-300" },
  { label: "Automations Saved", icon: Sparkles, color: "text-violet-300" },
  { label: "Business Impact", icon: BarChart3, color: "text-amber-300" }
];

export function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [builderNodes, setBuilderNodes] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string>("");
  const sensors = useSensors(useSensor(PointerSensor));
  const nodePalette = ["orchestrator", "document_intelligence", "communication", "analytics"];

  const stats = useMemo(() => {
    const runs = workflows.reduce((sum, item) => sum + item.runs_today, 0);
    return [runs, workflows.length, Math.round(runs * 0.75), `${Math.min(100, runs * 2)}%`];
  }, [workflows]);

  function openBuilder(wf: Workflow) {
    setSelected(wf.id);
    try {
      const parsed = JSON.parse(wf.graph_json || "[]");
      setBuilderNodes(
        Array.isArray(parsed)
          ? parsed.map((node, idx) => `${String(node)}::${idx}-${Date.now()}`)
          : []
      );
    } catch {
      setBuilderNodes([]);
    }
    setTestResult("");
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

  async function saveGraph(workflowId: string) {
    await api.put(`/workflows/${workflowId}/graph`, {
      nodes: builderNodes.map((node) => node.split("::")[0])
    });
    const data = await loadWorkflows();
    setWorkflows(data);
  }

  async function runTest(workflowId: string) {
    const { data } = await api.post(`/workflows/${workflowId}/run-test`);
    const trace = (data.trace ?? []).join(" -> ");
    setTestResult(`${trace} | ${data.analytics ?? ""}`);
    const refreshed = await loadWorkflows();
    setWorkflows(refreshed);
  }

  async function loadWorkflows() {
    const { data } = await api.get<Workflow[]>("/workflows");
    return data;
  }

  async function createFromPrompt() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      await api.post("/workflows/create-from-prompt", { prompt });
      setPrompt("");
      const data = await loadWorkflows();
      setWorkflows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    api
      .get<Workflow[]>("/workflows")
      .then(({ data }) => {
        if (!cancelled) {
          setWorkflows(data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold">SmartFlow AI</h1>
      <p className="mt-2 text-slate-300">Intelligent AI-powered business workflow automation</p>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {statCards.map((card, idx) => (
          <article key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <card.icon className={card.color} size={20} />
            <p className="mt-3 text-xs text-slate-300">{card.label}</p>
            <p className="text-2xl font-semibold">{stats[idx]}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-medium text-slate-300">Create workflow with AI prompt</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row">
          <input
            className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 outline-none"
            placeholder='Example: After payment, send invoice and thank-you email'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-black disabled:opacity-60"
            onClick={createFromPrompt}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Workflow"}
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-4">
        {workflows.map((wf) => (
          <article key={wf.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{wf.name}</h3>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
                {wf.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{wf.description}</p>
            <p className="mt-3 text-xs text-slate-400">Trigger: {wf.trigger}</p>
            <p className="mt-1 text-xs text-slate-400">Runs today: {wf.runs_today}</p>
            <button
              className="mt-4 rounded-lg border border-cyan-400/40 px-3 py-2 text-xs text-cyan-200"
              onClick={() => openBuilder(wf)}
            >
              Open Builder
            </button>
          </article>
        ))}
      </section>

      {selected && (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-medium text-slate-300">Drag-and-drop workflow builder</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {nodePalette.map((node) => (
              <button
                key={node}
                className="rounded-md border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-xs"
                onClick={() =>
                  setBuilderNodes((prev) => [...prev, `${node}::${Date.now()}-${Math.random()}`])
                }
              >
                + {node}
              </button>
            ))}
          </div>
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <SortableContext items={builderNodes} strategy={verticalListSortingStrategy}>
              <div className="mt-4 grid gap-2">
                {builderNodes.map((node, idx) => (
                  <SortableNode key={`${node}-${idx}`} id={node} label={node.split("::")[0]} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <div className="mt-4 flex gap-2">
            <button
              className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-black"
              onClick={() => saveGraph(selected)}
            >
              Save Graph
            </button>
            <button
              className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-medium text-black"
              onClick={() => runTest(selected)}
            >
              Run Test
            </button>
          </div>
          {testResult && <p className="mt-3 text-xs text-slate-300">{testResult}</p>}
        </section>
      )}
    </main>
  );
}

function SortableNode({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm active:cursor-grabbing"
    >
      {label}
    </div>
  );
}

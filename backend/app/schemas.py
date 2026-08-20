from typing import Optional
from pydantic import BaseModel


class WorkflowCreatePrompt(BaseModel):
    prompt: str
    provider: Optional[str] = "auto"  # "auto", "groq", "gemini", "openai", "local", "fallback"
    api_key: Optional[str] = None


class WorkflowCreateManual(BaseModel):
    name: str
    description: str
    category: Optional[str] = "Operations"
    trigger: str
    trigger_type: Optional[str] = "webhook"
    nodes: Optional[list[str]] = None


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    trigger: Optional[str] = None
    trigger_type: Optional[str] = None
    status: Optional[str] = None
    time_saved_mins: Optional[int] = None


class WorkflowOut(BaseModel):
    id: str
    name: str
    description: str
    category: str
    trigger: str
    trigger_type: str
    status: str
    runs_today: int
    total_runs: int
    success_rate: float
    time_saved_mins: int
    graph_json: str

    class Config:
        from_attributes = True


class WorkflowGraphUpdate(BaseModel):
    nodes: list[str]


class WorkflowRunTestPayload(BaseModel):
    input_payload: Optional[dict] = None


class WorkflowRunOut(BaseModel):
    id: str
    workflow_id: str
    status: str
    duration_ms: int
    time_saved_mins: int
    trace: list[str]
    analytics: str
    context: str
    input_payload: dict
    output_payload: dict
    created_at: str


class WorkflowTemplateOut(BaseModel):
    id: str
    name: str
    description: str
    category: str
    trigger: str
    trigger_type: str
    nodes: list[str]
    time_saved_mins: int


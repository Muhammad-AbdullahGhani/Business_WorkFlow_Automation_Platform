from pydantic import BaseModel


class WorkflowCreatePrompt(BaseModel):
    prompt: str


class WorkflowOut(BaseModel):
    id: str
    name: str
    description: str
    trigger: str
    status: str
    runs_today: int
    graph_json: str

    class Config:
        from_attributes = True


class WorkflowGraphUpdate(BaseModel):
    nodes: list[str]

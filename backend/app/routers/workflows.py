import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Workflow
from app.schemas import WorkflowCreatePrompt, WorkflowGraphUpdate
from app.services.agent_graph import generate_workflow_from_prompt, run_langgraph_pipeline
from app.services.rag import retrieve_business_context

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("")
def list_workflows(db: Session = Depends(get_db)):
    return db.query(Workflow).order_by(Workflow.name.asc()).all()


@router.post("/create-from-prompt")
async def create_workflow_from_prompt(payload: WorkflowCreatePrompt, db: Session = Depends(get_db)):
    _ = retrieve_business_context(payload.prompt)
    draft = await generate_workflow_from_prompt(payload.prompt)
    workflow = Workflow(**draft)
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.put("/{workflow_id}/graph")
def update_workflow_graph(workflow_id: str, payload: WorkflowGraphUpdate, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        return {"error": "Workflow not found"}
    workflow.graph_json = json.dumps(payload.nodes)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.post("/{workflow_id}/run-test")
def run_workflow_test(workflow_id: str, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        return {"error": "Workflow not found"}
    nodes = json.loads(workflow.graph_json or "[]")
    result = run_langgraph_pipeline(workflow.description, nodes)
    workflow.runs_today = (workflow.runs_today or 0) + 1
    workflow.status = "active"
    db.commit()
    return {"workflow_id": workflow_id, **result}

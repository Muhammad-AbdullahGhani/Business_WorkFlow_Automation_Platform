import json
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Workflow, WorkflowRun
from app.schemas import (
    WorkflowCreateManual,
    WorkflowCreatePrompt,
    WorkflowGraphUpdate,
    WorkflowOut,
    WorkflowRunOut,
    WorkflowRunTestPayload,
    WorkflowTemplateOut,
    WorkflowUpdate,
)
from app.services.agent_graph import generate_workflow_from_prompt, run_langgraph_pipeline
from app.services.rag import retrieve_business_context
from app.services.templates import WORKFLOW_TEMPLATES

router = APIRouter(prefix="/workflows", tags=["workflows"])


def _seed_initial_workflows(db: Session):
    """Seed initial high-quality workflows if database is empty."""
    count = db.query(Workflow).count()
    if count == 0:
        for tpl in WORKFLOW_TEMPLATES[:3]:
            wf = Workflow(
                id=f"wf_{uuid.uuid4().hex[:10]}",
                name=tpl["name"],
                description=tpl["description"],
                category=tpl["category"],
                trigger=tpl["trigger"],
                trigger_type=tpl["trigger_type"],
                status="active",
                runs_today=3,
                total_runs=18,
                success_rate=98.5,
                time_saved_mins=tpl["time_saved_mins"],
                graph_json=json.dumps(tpl["nodes"]),
                created_at=datetime.utcnow() - timedelta(days=2),
                updated_at=datetime.utcnow(),
            )
            db.add(wf)
        db.commit()


@router.get("", response_model=list[WorkflowOut])
def list_workflows(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    _seed_initial_workflows(db)
    query = db.query(Workflow)
    if status and status != "all":
        query = query.filter(Workflow.status == status)
    if category and category != "all":
        query = query.filter(Workflow.category == category)
    if search:
        query = query.filter(Workflow.name.ilike(f"%{search}%") | Workflow.description.ilike(f"%{search}%"))
    return query.order_by(Workflow.created_at.desc()).all()


@router.get("/templates/list", response_model=list[WorkflowTemplateOut])
def list_templates():
    return WORKFLOW_TEMPLATES


@router.post("/templates/{template_id}/clone", response_model=WorkflowOut)
def clone_template(template_id: str, db: Session = Depends(get_db)):
    tpl = next((t for t in WORKFLOW_TEMPLATES if t["id"] == template_id), None)
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")

    workflow = Workflow(
        id=f"wf_{uuid.uuid4().hex[:10]}",
        name=tpl["name"],
        description=tpl["description"],
        category=tpl["category"],
        trigger=tpl["trigger"],
        trigger_type=tpl["trigger_type"],
        status="active",
        runs_today=0,
        total_runs=0,
        success_rate=100.0,
        time_saved_mins=tpl["time_saved_mins"],
        graph_json=json.dumps(tpl["nodes"]),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.post("/create-from-prompt", response_model=WorkflowOut)
async def create_workflow_from_prompt(payload: WorkflowCreatePrompt, db: Session = Depends(get_db)):
    _ = retrieve_business_context(payload.prompt)
    draft = await generate_workflow_from_prompt(payload.prompt, provider=payload.provider or "auto", api_key=payload.api_key)
    workflow = Workflow(**draft)
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.post("", response_model=WorkflowOut)
def create_workflow_manual(payload: WorkflowCreateManual, db: Session = Depends(get_db)):
    nodes = payload.nodes or ["webhook_trigger", "ai_summarizer", "send_slack_alert", "analytics"]
    workflow = Workflow(
        id=f"wf_{uuid.uuid4().hex[:10]}",
        name=payload.name,
        description=payload.description,
        category=payload.category or "Operations",
        trigger=payload.trigger,
        trigger_type=payload.trigger_type or "webhook",
        status="active",
        runs_today=0,
        total_runs=0,
        success_rate=100.0,
        time_saved_mins=len(nodes) * 5 + 10,
        graph_json=json.dumps(nodes),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.get("/{workflow_id}", response_model=WorkflowOut)
def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowOut)
def update_workflow(workflow_id: str, payload: WorkflowUpdate, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if payload.name is not None:
        workflow.name = payload.name
    if payload.description is not None:
        workflow.description = payload.description
    if payload.category is not None:
        workflow.category = payload.category
    if payload.trigger is not None:
        workflow.trigger = payload.trigger
    if payload.trigger_type is not None:
        workflow.trigger_type = payload.trigger_type
    if payload.status is not None:
        workflow.status = payload.status
    if payload.time_saved_mins is not None:
        workflow.time_saved_mins = payload.time_saved_mins

    workflow.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(workflow)
    return workflow


@router.delete("/{workflow_id}")
def delete_workflow(workflow_id: str, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    db.delete(workflow)
    db.commit()
    return {"status": "success", "message": f"Workflow {workflow_id} deleted successfully"}


@router.post("/{workflow_id}/duplicate", response_model=WorkflowOut)
def duplicate_workflow(workflow_id: str, db: Session = Depends(get_db)):
    source = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Workflow not found")

    new_wf = Workflow(
        id=f"wf_{uuid.uuid4().hex[:10]}",
        name=f"{source.name} (Copy)",
        description=source.description,
        category=source.category,
        trigger=source.trigger,
        trigger_type=source.trigger_type,
        status="draft",
        runs_today=0,
        total_runs=0,
        success_rate=100.0,
        time_saved_mins=source.time_saved_mins,
        graph_json=source.graph_json,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_wf)
    db.commit()
    db.refresh(new_wf)
    return new_wf


@router.put("/{workflow_id}/graph", response_model=WorkflowOut)
def update_workflow_graph(workflow_id: str, payload: WorkflowGraphUpdate, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflow.graph_json = json.dumps(payload.nodes)
    workflow.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(workflow)
    return workflow


@router.post("/{workflow_id}/run-test")
def run_workflow_test(
    workflow_id: str,
    payload: Optional[WorkflowRunTestPayload] = None,
    db: Session = Depends(get_db),
):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    nodes = json.loads(workflow.graph_json or "[]")
    input_data = (payload and payload.input_payload) or {"source": "manual_test", "trigger": workflow.trigger}
    result = run_langgraph_pipeline(workflow.description, nodes, input_payload=input_data)

    # Update workflow counters
    workflow.runs_today = (workflow.runs_today or 0) + 1
    workflow.total_runs = (workflow.total_runs or 0) + 1
    if workflow.status == "draft":
        workflow.status = "active"

    # Persist execution run log
    run_log = WorkflowRun(
        id=f"run_{uuid.uuid4().hex[:10]}",
        workflow_id=workflow_id,
        status="success",
        duration_ms=result["duration_ms"],
        time_saved_mins=result["time_saved_mins"],
        trace_json=json.dumps(result.get("trace", [])),
        analytics=result.get("analytics", ""),
        context=result.get("context", ""),
        input_payload=json.dumps(result.get("input_payload", {})),
        output_payload=json.dumps(result.get("output_payload", {})),
        created_at=datetime.utcnow(),
    )
    db.add(run_log)
    db.commit()
    db.refresh(workflow)

    return {
        "workflow_id": workflow_id,
        "run_id": run_log.id,
        "status": "success",
        "duration_ms": result["duration_ms"],
        "time_saved_mins": result["time_saved_mins"],
        "trace": result.get("trace", []),
        "analytics": result.get("analytics", ""),
        "context": result.get("context", ""),
        "output_payload": result.get("output_payload", {}),
    }


@router.get("/{workflow_id}/runs", response_model=list[WorkflowRunOut])
def get_workflow_runs(workflow_id: str, limit: int = Query(default=10, le=50), db: Session = Depends(get_db)):
    runs = (
        db.query(WorkflowRun)
        .filter(WorkflowRun.workflow_id == workflow_id)
        .order_by(WorkflowRun.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        WorkflowRunOut(
            id=r.id,
            workflow_id=r.workflow_id,
            status=r.status,
            duration_ms=r.duration_ms,
            time_saved_mins=r.time_saved_mins,
            trace=json.loads(r.trace_json or "[]"),
            analytics=r.analytics,
            context=r.context,
            input_payload=json.loads(r.input_payload or "{}"),
            output_payload=json.loads(r.output_payload or "{}"),
            created_at=r.created_at.isoformat(),
        )
        for r in runs
    ]


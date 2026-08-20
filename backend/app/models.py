from datetime import datetime
from sqlalchemy import String, Text, Integer, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(64), default="Operations")
    trigger: Mapped[str] = mapped_column(String(255), nullable=False)
    trigger_type: Mapped[str] = mapped_column(String(64), default="webhook")
    status: Mapped[str] = mapped_column(String(32), default="active")
    runs_today: Mapped[int] = mapped_column(Integer, default=0)
    total_runs: Mapped[int] = mapped_column(Integer, default=0)
    success_rate: Mapped[float] = mapped_column(Float, default=100.0)
    time_saved_mins: Mapped[int] = mapped_column(Integer, default=15)
    graph_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    workflow_id: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="success")  # success, failed, running
    duration_ms: Mapped[int] = mapped_column(Integer, default=320)
    time_saved_mins: Mapped[int] = mapped_column(Integer, default=15)
    trace_json: Mapped[str] = mapped_column(Text, default="[]")
    analytics: Mapped[str] = mapped_column(Text, default="")
    context: Mapped[str] = mapped_column(Text, default="")
    input_payload: Mapped[str] = mapped_column(Text, default="{}")
    output_payload: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


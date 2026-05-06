from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, engine
from app.routers.workflows import router as workflow_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartFlow AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(workflow_router)


@app.get("/health")
def health():
    return {"status": "ok"}

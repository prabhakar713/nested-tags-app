from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import models
import database
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Nested Tags Tree API")

# Configure CORS origins via environment variable `FRONTEND_ORIGINS`
# Comma-separated list, e.g. "https://app.vercel.app,http://localhost:5173"
# If not provided (e.g. quick deploy), default to allow all origins so deployed frontends can reach the API.
# NOTE: For production lock this down by setting `FRONTEND_ORIGINS` to the exact frontend URL(s).
frontend_env = os.environ.get("FRONTEND_ORIGINS")
if frontend_env:
    allow_origins = [u.strip() for u in frontend_env.split(",") if u.strip()]
else:
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class TreePayload(BaseModel):
    data: Dict[str, Any]

class TreeResponse(BaseModel):
    id: int
    data: Dict[str, Any]

    class Config:
        from_attributes = True

@app.get("/", tags=["Health"])
def health():
    return {"status": "ok"}

@app.get("/trees", response_model=List[TreeResponse])
def get_trees(db: Session = Depends(get_db)):
    trees = db.query(models.Tree).all()
    return [{"id": t.id, "data": json.loads(t.data)} for t in trees]

@app.post("/trees", response_model=TreeResponse)
def create_tree(payload: TreePayload, db: Session = Depends(get_db)):
    db_tree = models.Tree(data=json.dumps(payload.data))
    db.add(db_tree)
    db.commit()
    db.refresh(db_tree)
    return {"id": db_tree.id, "data": payload.data}

@app.put("/trees/{tree_id}", response_model=TreeResponse)
def update_tree(tree_id: int, payload: TreePayload, db: Session = Depends(get_db)):
    db_tree = db.query(models.Tree).filter(models.Tree.id == tree_id).first()
    if not db_tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    db_tree.data = json.dumps(payload.data)
    db.commit()
    db.refresh(db_tree)
    return {"id": db_tree.id, "data": payload.data}

@app.get("/trees/{tree_id}", response_model=TreeResponse)
def get_tree(tree_id: int, db: Session = Depends(get_db)):
    db_tree = db.query(models.Tree).filter(models.Tree.id == tree_id).first()
    if not db_tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    return {"id": db_tree.id, "data": json.loads(db_tree.data)}

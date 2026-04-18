from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.db.session import engine
from app.models import user
from app.models import alert
from app.models import recovery

# Create all tables
user.Base.metadata.create_all(bind=engine)
alert.Base.metadata.create_all(bind=engine)
recovery.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ransomware Detection Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.api import api_router
from app.db.session import engine
from app.models import user, alert, recovery, company, setup_token, token_blacklist

# Create tables
for model in [user, alert, recovery, company, setup_token, token_blacklist]:
    model.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ransomware Detection Backend")

ALLOWED_ORIGINS = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Catches unhandled server errors and keeps CORS headers intact
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={"Access-Control-Allow-Origin": request.headers.get("origin", "*")},
    )

app.include_router(api_router, prefix="/api/v1")
import os
import json
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.api.v1.endpoints.monitor import connected_clients

router = APIRouter()

CONFIG_FILE = os.getenv("AGENT_CONFIG_FILE",os.path.join(os.path.dirname(os.getcwd()), "agent", "agent_config.json"))

@router.get("/agent_identity")
async def get_agent_identity():
    if not os.path.exists(CONFIG_FILE):
        return JSONResponse(content={"error": "Agent config not found"}, status_code=404)
    with open(CONFIG_FILE) as f:
        data = json.load(f)
    return JSONResponse(content=data)

@router.get("/agent_status")
async def get_agent_status():
    if not os.path.exists(CONFIG_FILE):
        return JSONResponse(content={"connected": False})
    with open(CONFIG_FILE) as f:
        data = json.load(f)
    host = data.get("hostname") or data.get("agent_id")
    is_connected = host in connected_clients  # ← checks the right dict
    return JSONResponse(content={"connected": is_connected, "host": host})
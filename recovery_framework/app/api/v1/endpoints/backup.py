from fastapi import APIRouter
from pydantic import BaseModel
from app.api.v1.endpoints.monitor import send_command, connected_clients

router = APIRouter()


class BackupRequest(BaseModel):
    agent_id: str
    paths: list[str]


@router.post("/")
async def trigger_backup(request: BackupRequest):
    host = request.agent_id
    if host not in connected_clients:
        return {"status": "error", "message": f"Agent {host} not connected"}

    success = await send_command(host, {
        "action": "start_backup",
        "paths": request.paths
    })

    if success:
        return {"status": "backup command sent"}
    return {"status": "error", "message": "Failed to send backup command"}


@router.post("/trigger/{host}")
async def trigger_recovery(host: str):
    if host not in connected_clients:
        return {"error": "Host not connected"}

    success = await send_command(host, {"action": "start_recovery"})
    if success:
        return {"message": f"Recovery command sent to {host}"}
    return {"error": "Failed to send command"}
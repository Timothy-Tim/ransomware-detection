from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import register_frontend, unregister_frontend

router = APIRouter()

@router.websocket("/ws/frontend/{agent_id}")
async def frontend_ws(websocket: WebSocket, agent_id: str):
    await websocket.accept()
    await register_frontend(agent_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        await unregister_frontend(agent_id, websocket)
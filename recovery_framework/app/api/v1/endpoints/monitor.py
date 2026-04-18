from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from app.services.alert_service import create_alert
from app.core.security import decode_token
from app.api.v1.endpoints.auth import get_current_user
from typing import Optional

router = APIRouter()

connected_clients: dict[str, WebSocket] = {}
frontend_listeners: dict[str, list[WebSocket]] = {}


@router.get("/agents")
async def get_connected_agents(current_user=Depends(get_current_user)):
    return list(connected_clients.keys())


@router.websocket("/ws")
async def agent_websocket(websocket: WebSocket):
    await websocket.accept()
    host: Optional[str] = None
    try:
        init_data = await websocket.receive_json()
        host = init_data.get("host")
        if not host:
            await websocket.close(code=1008)
            return

        if host in connected_clients:
            try:
                await connected_clients[host].close()
            except Exception:
                pass

        connected_clients[host] = websocket
        print(f"[WS] Agent {host} connected. Total: {len(connected_clients)}")

        await _notify_frontend(host, {
            "type": "agent_status",
            "connected": True,
            "host": host
        })

        while True:
            data = await websocket.receive_json()
            print(f"[{host}] {data}")
            if data.get("type") == "ransomware_detected":
                create_alert(
                    host=host,
                    file=data.get("file", ""),
                    reason=data.get("reason", "")
                )
            await _notify_frontend(host, data)

    except WebSocketDisconnect:
        print(f"[WS] Agent {host} disconnected")
    finally:
        if host is not None:
            if connected_clients.get(host) is websocket:
                del connected_clients[host]
            await _notify_frontend(host, {
                "type": "agent_status",
                "connected": False,
                "host": host
            })
            print(f"[WS] Cleaned up {host}")


@router.websocket("/ws/frontend/{host}")
async def frontend_websocket(
    websocket: WebSocket,
    host: str,
    token: str = Query(...)
):
    try:
        payload = decode_token(token)
        if not payload.get("sub"):
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    if host not in frontend_listeners:
        frontend_listeners[host] = []
    frontend_listeners[host].append(websocket)
    print(f"[WS] Frontend listening for host: {host}")

    await websocket.send_json({
        "type": "agent_status",
        "connected": len(connected_clients) > 0,
        "host": host
    })

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if host in frontend_listeners:
            frontend_listeners[host] = [
                ws for ws in frontend_listeners[host] if ws is not websocket
            ]
        print(f"[WS] Frontend disconnected for host: {host}")


async def _notify_frontend(host: str, data: dict) -> None:
    # ✅ Notify specific host listeners AND "all" listeners
    targets = list(frontend_listeners.get(host, []))
    for ws in frontend_listeners.get("all", []):
        if ws not in targets:
            targets.append(ws)

    print(f"[DEBUG _notify] type={data.get('type')} host={host} targets={len(targets)}")

    dead = []
    for ws in targets:
        try:
            await ws.send_json(data)
            print(f"[DEBUG _notify] sent successfully")
        except Exception as e:
            print(f"[DEBUG _notify] failed: {e}")
            dead.append(ws)

    for host_key in [host, "all"]:
        if host_key in frontend_listeners:
            frontend_listeners[host_key] = [
                ws for ws in frontend_listeners[host_key] if ws not in dead
            ]


async def send_command(host: str, command: dict) -> bool:
    ws = connected_clients.get(host)
    if ws:
        try:
            await ws.send_json(command)
            print(f"[Command] Sent to {host}: {command}")
            return True
        except Exception as e:
            print(f"[Command] Failed to send to {host}: {e}")
    else:
        print(f"[Command] Host {host} not connected")
    return False
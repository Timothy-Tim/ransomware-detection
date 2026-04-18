from __future__ import annotations
import asyncio
import json
from typing import Dict, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

# Map of agent_id -> WebSocket connection
connected_agents: Dict[str, WebSocket] = {}
lock = asyncio.Lock()


# -----------------------------
# Agent management
# -----------------------------
async def register_agent(agent_id: str, ws: WebSocket) -> None:
    async with lock:
        connected_agents[agent_id] = ws
        print(f"[WS Manager] Registered agent {agent_id}")


async def unregister_agent(agent_id: str) -> None:
    async with lock:
        if agent_id in connected_agents:
            del connected_agents[agent_id]
            print(f"[WS Manager] Unregistered agent {agent_id}")


async def send_command_to_agent(agent_id: str, command: dict) -> None:
    async with lock:
        ws: Optional[WebSocket] = connected_agents.get(agent_id)

    if ws is None:
        raise ValueError(f"Agent {agent_id} is not connected")

    await ws.send_text(json.dumps(command))
    print(f"[WS Manager] Sent command to {agent_id}: {command}")


# -----------------------------
# WebSocket endpoint
# -----------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    agent_id: Optional[str] = None

    try:
        # Expect the first message to be registration
        data = await ws.receive_text()
        payload = json.loads(data)

        agent_id = payload.get("agent_id")
        msg_type = payload.get("type")
        
        print(f"[Server] First message received: {payload}")
        print(f"[Server] msg_type={msg_type!r}, agent_id={agent_id!r}")

        if msg_type != "register" or not isinstance(agent_id, str):
            # Reject invalid registration
            await ws.close(code=1008)
            return

        await register_agent(agent_id, ws)

        # Main loop: receive events from agent
        while True:
            msg_text = await ws.receive_text()
            try:
                event: dict = json.loads(msg_text)
            except json.JSONDecodeError:
                print(f"[Server] Invalid JSON from {agent_id}: {msg_text}")
                continue

            print(f"[Server] Event from {agent_id}: {event}")
            # Here you could process events or trigger commands

    except WebSocketDisconnect:
        print(f"[Server] Agent {agent_id} disconnected")
    except Exception as e:
        print(f"[Server] Error: {e}")
        await ws.close(code=1011)
    finally:
        # Only unregister if agent_id is valid
        if isinstance(agent_id, str):
            await unregister_agent(agent_id)
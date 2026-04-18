from __future__ import annotations
import asyncio
import json
from typing import Dict, Optional, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

connected_agents: Dict[str, WebSocket] = {}
frontend_connections: Dict[str, Set[WebSocket]] = {}
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
# Frontend management
# -----------------------------
async def register_frontend(agent_id: str, ws: WebSocket) -> None:
    async with lock:
        if agent_id not in frontend_connections:
            frontend_connections[agent_id] = set()
        frontend_connections[agent_id].add(ws)
        print(f"[WS Manager] Frontend connected for agent {agent_id}")

async def unregister_frontend(agent_id: str, ws: WebSocket) -> None:
    async with lock:
        if agent_id in frontend_connections:
            frontend_connections[agent_id].discard(ws)

async def forward_event_to_frontend(agent_id: str, event: dict) -> None:
    async with lock:
        frontends: Set[WebSocket] = set(frontend_connections.get(agent_id, set()))
    for ws in frontends:
        try:
            await ws.send_text(json.dumps(event))
        except Exception:
            pass
import json
import asyncio
import logging
import websockets
from agent.event_queue import event_queue
from agent.command_handler import handle_command
from agent.config import BACKEND_WS_URL

logging.basicConfig(level=logging.DEBUG)

TOKEN = None  # Set to your JWT string if auth is required


async def run_websocket(identity: dict):
    """Connect to backend WebSocket and handle events/commands."""
    host = identity.get("hostname") or identity.get("agent_id")
    if not host:
        logging.error("[Agent] No hostname or agent_id found in identity config")
        return

    headers = {}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"

    while True:
        try:
            async with websockets.connect(BACKEND_WS_URL, additional_headers=headers) as ws:
                register_payload = {"host": host}
                await ws.send(json.dumps(register_payload))
                logging.info(f"[Agent] Connected and registered: {register_payload}")

                async def send_events():
                    while True:
                        event = await event_queue.get()
                        try:
                            await ws.send(json.dumps(event))
                            logging.debug(f"[Agent] Sent event: {event}")
                        except websockets.ConnectionClosedError as e:
                            logging.warning(f"[Agent] Failed to send event: {e}")
                            break

                async def receive_commands():
                    while True:
                        try:
                            message = await ws.recv()
                            command = json.loads(message)
                            logging.debug(f"[Agent] Received command: {command}")
                            await handle_command(command)
                        except websockets.ConnectionClosedError as e:
                            logging.warning(f"[Agent] Connection closed while receiving: {e}")
                            break
                        except json.JSONDecodeError as e:
                            logging.error(f"[Agent] Failed to decode command: {e}")

                await asyncio.gather(send_events(), receive_commands())

        except Exception as e:
            logging.error(f"[Agent] WebSocket connection failed: {e}")

        logging.info("[Agent] Reconnecting in 5 seconds...")
        await asyncio.sleep(5)
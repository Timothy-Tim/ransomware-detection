import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from agent.identity import get_or_create_identity
from agent.websocket_client import run_websocket
from agent.services.monitor_service import start_file_monitor
from agent.services.detection_service import analyze_and_queue
from agent.event_queue import event_queue

WATCH_PATH = os.path.expanduser("~/watch_folder")

async def main():
    os.makedirs(WATCH_PATH, exist_ok=True)
    print(f"[Agent] Watching folder: {WATCH_PATH}")

    identity = get_or_create_identity()

    # ✅ Get the main event loop BEFORE starting the thread
    loop = asyncio.get_event_loop()

    def handle_file_event(file_path: str):
        # ✅ Pass the loop explicitly — no get_event_loop() in thread
        asyncio.run_coroutine_threadsafe(
            analyze_and_queue(file_path),
            loop
        )

    start_file_monitor(WATCH_PATH, handle_file_event)
    await run_websocket(identity)

if __name__ == "__main__":
    asyncio.run(main())
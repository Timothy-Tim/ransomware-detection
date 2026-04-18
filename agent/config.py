import os

BACKEND_WS_URL = os.getenv("BACKEND_WS_URL", "ws://localhost:8000/api/v1/monitor/ws")
CONFIG_FILE = "agent/agent_config.json"

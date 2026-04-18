from datetime import datetime

# Simple in-memory dict — no need to persist live status
monitor_state = {}

def update_host_status(host: str, status: str):
    monitor_state[host] = {
        "status": status,
        "timestamp": datetime.utcnow().isoformat()
    }
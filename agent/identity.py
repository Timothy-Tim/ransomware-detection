import uuid
import socket
import json
import os
from agent.config import CONFIG_FILE

def get_or_create_identity():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            return json.load(f)

    identity = {
        "agent_id": str(uuid.uuid4()),
        "hostname": socket.gethostname()
    }

    os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)

    with open(CONFIG_FILE, "w") as f:
        json.dump(identity, f)

    return identity
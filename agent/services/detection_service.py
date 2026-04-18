from agent.event_queue import event_queue
from agent.identity import get_or_create_identity
import os
import math
import time
from collections import defaultdict

KNOWN_RANSOMWARE_EXTENSIONS = [".locky", ".crypt", ".crypted", ".enc", ".infected"]
ENTROPY_THRESHOLD = 7.5
MODIFICATION_TRACKER = defaultdict(list)
MODIFICATION_THRESHOLD = 10
TIME_WINDOW = 5


def calculate_entropy(file_path: str) -> float:
    try:
        with open(file_path, "rb") as f:
            data = f.read(4096)
        if not data:
            return 0.0
        byte_counts = [0] * 256
        for byte in data:
            byte_counts[byte] += 1
        entropy = 0.0
        for count in byte_counts:
            if count == 0:
                continue
            p = count / len(data)
            entropy -= p * math.log2(p)
        return entropy
    except Exception:
        return 0.0

def analyze_file(file_path: str) -> dict:
    if not os.path.isfile(file_path):
        return {"infected": False, "reason": "not_a_file"}

    # 1. Extension check
    _, ext = os.path.splitext(file_path)
    if ext.lower() in KNOWN_RANSOMWARE_EXTENSIONS:
        return {"infected": True, "reason": f"suspicious_extension ({ext})"}

    # 2. Entropy check
    entropy = calculate_entropy(file_path)
    if entropy > ENTROPY_THRESHOLD:
        return {"infected": True, "reason": f"high_entropy ({entropy:.2f})"}

    # 3. Rapid modification check
    directory = os.path.dirname(file_path)
    now = time.time()
    MODIFICATION_TRACKER[directory].append(now)
    MODIFICATION_TRACKER[directory] = [
        t for t in MODIFICATION_TRACKER[directory] if now - t <= TIME_WINDOW
    ]
    if len(MODIFICATION_TRACKER[directory]) >= MODIFICATION_THRESHOLD:
        return {"infected": True, "reason": "mass_file_modification"}

    return {"infected": False, "reason": "clean"}


async def analyze_and_queue(file_path: str):
    result = analyze_file(file_path)
    
    #  Always derive original path
    root, ext = os.path.splitext(file_path)
    original_path = root if os.path.splitext(root)[1] else file_path
    infected_files: set[str] = set()

    if result["infected"]:
        identity = get_or_create_identity()
        host = identity.get("hostname") or identity.get("agent_id")

        print(f"[Detection] Ransomware detected: {file_path} — {result['reason']}")
        
        infected_files.add(file_path)

        # Send correct event format to backend
        await event_queue.put({
            "type": "ransomware_detected",
            "host": host,
            "file": file_path,
            "reason": result["reason"],
            "timestamp": time.time()
        })

        # infected_files.add(file_path)
        # # Disabled during testing — too aggressive, kills all processes
        # #stop_processes(allowed=["python"])
        # delete_infected([file_path])
        # restore_files([file_path])
    else:
        # Also send clean events so monitor page shows activity
        await event_queue.put({
            "type": "ransomware_detected",
            "host": host, # type: ignore
            "file": original_path,
            "reason": result["reason"],
            "timestamp": time.time(),
            "status": "clean"
        })
        


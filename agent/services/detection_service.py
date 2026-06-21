from agent.event_queue import event_queue
from agent.identity import get_or_create_identity
import os
import math
import time
import shutil
from collections import defaultdict

KNOWN_RANSOMWARE_EXTENSIONS = [".locky", ".crypt", ".crypted", ".enc", ".infected"]
ENTROPY_THRESHOLD = 7.5
MODIFICATION_TRACKER = defaultdict(list)
MODIFICATION_THRESHOLD = 10
TIME_WINDOW = 5

# Quarantine folder — sits next to the watch folder
QUARANTINE_DIR = os.path.join(os.path.expanduser("~"), "quarantine")


def ensure_quarantine_dir():
    """Create quarantine folder if it doesn't exist."""
    os.makedirs(QUARANTINE_DIR, exist_ok=True)


def quarantine_file(file_path: str) -> str | None:
    """
    Move infected file to quarantine folder.
    Returns the quarantine path on success, None on failure.
    """
    try:
        ensure_quarantine_dir()
        filename = os.path.basename(file_path)

        # Avoid overwriting existing quarantined files with same name
        timestamp = int(time.time())
        quarantine_name = f"{timestamp}_{filename}"
        quarantine_path = os.path.join(QUARANTINE_DIR, quarantine_name)

        shutil.move(file_path, quarantine_path)
        print(f"[Quarantine] Moved {file_path} → {quarantine_path}")
        return quarantine_path

    except Exception as e:
        print(f"[Quarantine] Failed to quarantine {file_path}: {e}")
        return None


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

    root, ext = os.path.splitext(file_path)
    original_path = root if os.path.splitext(root)[1] else file_path

    identity = get_or_create_identity()
    host = identity.get("hostname") or identity.get("agent_id")

    if result["infected"]:
        print(f"[Detection] Ransomware detected: {file_path} — {result['reason']}")

        # ── QUARANTINE the infected file ──
        quarantine_path = quarantine_file(file_path)

        if quarantine_path:
            print(f"[Detection] File quarantined successfully.")
            quarantine_status = "quarantined"
        else:
            print(f"[Detection] Quarantine failed — file left in place.")
            quarantine_status = "quarantine_failed"

        # Send event to backend with quarantine info
        await event_queue.put({
            "type": "ransomware_detected",
            "host": host,
            "file": file_path,
            "original_path": original_path,
            "quarantine_path": quarantine_path,
            "quarantine_status": quarantine_status,
            "reason": result["reason"],
            "timestamp": time.time()
        })

    else:
        # Send clean event so monitor page shows activity
        await event_queue.put({
            "type": "file_scanned",
            "host": host,
            "file": original_path,
            "reason": result["reason"],
            "timestamp": time.time(),
            "status": "clean"
        })
        


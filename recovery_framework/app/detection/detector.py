import os
import hashlib
import time
import math
from collections import defaultdict

# --- CONFIG ---
KNOWN_RANSOMWARE_EXTENSIONS = [".locky", ".crypt", ".crypted", ".enc"]
KNOWN_RANSOMWARE_HASHES = {
    # Add real threat intel hashes here — removed the empty-file MD5 false positive
}

MODIFICATION_TRACKER = defaultdict(list)
MODIFICATION_THRESHOLD = 10
TIME_WINDOW = 5
ENTROPY_THRESHOLD = 7.5


def detect_ransomware(file_path: str) -> dict:
    """
    Returns: {"infected": bool, "reason": str}
    """
    if not os.path.isfile(file_path):
        return {"infected": False, "reason": "not_a_file"}

    # 1. Extension check
    _, ext = os.path.splitext(file_path)
    if ext.lower() in KNOWN_RANSOMWARE_EXTENSIONS:
        return {"infected": True, "reason": "suspicious_extension"}

    # 2. Hash check
    try:
        file_hash = compute_md5(file_path)
        if file_hash in KNOWN_RANSOMWARE_HASHES:
            return {"infected": True, "reason": "known_ransomware_hash"}
    except Exception:
        pass

    # 3. Entropy check
    try:
        entropy = calculate_entropy(file_path)
        if entropy > ENTROPY_THRESHOLD:
            return {"infected": True, "reason": f"high_entropy ({entropy:.2f})"}
    except Exception:
        pass

    # 4. Rapid modification detection
    directory = os.path.dirname(file_path)
    now = time.time()
    MODIFICATION_TRACKER[directory].append(now)
    MODIFICATION_TRACKER[directory] = [
        t for t in MODIFICATION_TRACKER[directory]
        if now - t <= TIME_WINDOW
    ]
    if len(MODIFICATION_TRACKER[directory]) >= MODIFICATION_THRESHOLD:
        return {"infected": True, "reason": "mass_file_modification"}

    return {"infected": False, "reason": "clean"}


def compute_md5(file_path: str) -> str:
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def calculate_entropy(file_path: str) -> float:
    """Shannon entropy — high value suggests encrypted/compressed content."""
    with open(file_path, "rb") as f:
        data = f.read(4096)  # sample first 4KB
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
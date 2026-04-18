import os
import json
from pathlib import Path
from agent.event_queue import event_queue
from recovery_framework.app.services.s3_backup import backup_file


# ----------------------------
# Config Loader (robust)
# ----------------------------
CONFIG_PATH = Path(__file__).parent.parent / "agent_config.json"


_ALLOWED_PATHS_CACHE = None

def load_allowed_paths():
    global _ALLOWED_PATHS_CACHE

    if _ALLOWED_PATHS_CACHE is None:
        try:
            with open(CONFIG_PATH) as f:
                _ALLOWED_PATHS_CACHE = json.load(f).get("allowed_paths", [])
        except:
            _ALLOWED_PATHS_CACHE = []

    return _ALLOWED_PATHS_CACHE


# ----------------------------
# Validation
# ----------------------------
def is_allowed(path: Path) -> bool:
    allowed = [Path(p).resolve() for p in load_allowed_paths()]
    target = path.resolve()

    return any(target.is_relative_to(p) for p in allowed)


# ----------------------------
# Backup Helpers
# ----------------------------
def backup_single_file(file_path: Path):
    print(f"[Agent] Backing up file: {file_path}")
    backup_file(str(file_path))


def backup_directory(dir_path: Path):
    print(f"[Agent] Backing up directory: {dir_path}")

    for root, _, files in os.walk(dir_path):
        for file in files:
            full_path = Path(root) / file
            backup_single_file(full_path)


# ----------------------------
# Main Entry
# ----------------------------
async def start_backup(paths: list[str]):
    for path in paths:
        abs_path = os.path.abspath(path)

        if not os.path.exists(abs_path):
            await event_queue.put({"status": "error", "file": abs_path, "message": "Path not found"})
            continue

        if os.path.isfile(abs_path):
            try:
                s3_key = backup_file(abs_path)
                await event_queue.put({"status": "success", "file": abs_path, "s3_key": s3_key})
            except Exception as e:
                await event_queue.put({"status": "error", "file": abs_path, "message": str(e)})

        elif os.path.isdir(abs_path):
            # backup each file in directory
            for root, _, files in os.walk(abs_path):
                for f in files:
                    file_path = os.path.join(root, f)
                    try:
                        s3_key = backup_file(file_path)
                        await event_queue.put({"status": "success", "file": file_path, "s3_key": s3_key})
                    except Exception as e:
                        await event_queue.put({"status": "error", "file": file_path, "message": str(e)})

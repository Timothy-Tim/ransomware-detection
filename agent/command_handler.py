import os
import sys
import json
import asyncio
import psutil

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from recovery_framework.app.services.s3_backup import backup_file, restore_file

REGISTRY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backup_registry.json")

# -----------------------------
# Registry Helpers
# -----------------------------
def load_registry() -> dict:
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Registry] Failed to load registry: {e}")
    return {}

def save_registry(registry: dict):
    try:
        with open(REGISTRY_FILE, "w") as f:
            json.dump(registry, f, indent=2)
        print(f"[Registry] Saved {len(registry)} entries to {REGISTRY_FILE}")
    except Exception as e:
        print(f"[Registry] Failed to save registry: {e}")

BACKUP_REGISTRY = load_registry()

# -----------------------------
# Backup Helpers
# -----------------------------
def backup_paths(paths: list[str]) -> dict:
    results = {}
    for path in paths:
        if os.path.isfile(path):
            try:
                key = backup_file(path)
                results[path] = key
                print(f"[Backup] Uploaded file: {path} → s3://{key}")
            except Exception as e:
                print(f"[Backup] Failed to backup {path}: {e}")

        elif os.path.isdir(path):
            for root, dirs, files in os.walk(path):
                for fname in files:
                    full_path = os.path.join(root, fname)
                    try:
                        key = backup_file(full_path)
                        results[full_path] = key
                        print(f"[Backup] Uploaded: {full_path} → s3://{key}")
                    except Exception as e:
                        print(f"[Backup] Failed to backup {full_path}: {e}")
        else:
            print(f"[Backup] Path not found: {path}")

    BACKUP_REGISTRY.update(results)
    save_registry(BACKUP_REGISTRY)
    print(f"[Backup] Done. {len(results)} files backed up.")
    return results

# -----------------------------
# Recovery Helpers
# -----------------------------
def delete_infected(files: list[str]):
    for f in files:
        try:
            os.remove(f)
            print(f"[Recovery] Deleted infected file: {f}")
        except Exception as e:
            print(f"[Recovery] Failed to delete {f}: {e}")

def restore_files(files: list[str]):
    for f in files:
        s3_key = BACKUP_REGISTRY.get(f)
        if not s3_key:
            print(f"[Recovery] No backup found for {f} — was it backed up?")
            continue
        try:
            restore_file(s3_key, restore_path=f)
            print(f"[Recovery] Restored: {f}")
        except Exception as e:
            print(f"[Recovery] Failed to restore {f}: {e}")

# -----------------------------
# Command Handler
# -----------------------------
async def handle_command(command: dict):
    action = command.get("action")

    if action == "start_backup":
        paths = command.get("paths", [])
        print(f"[Backup] Starting backup for: {paths}")
        backup_paths(paths)

    elif action == "start_recovery":
        files = command.get("files", [])
        print("[Recovery] Entering recovery mode")
        delete_infected(files)
        restore_files(files)
        print("[Recovery] Completed")

    else:
        print(f"[Command] Unknown command: {command}")
import shutil
import os
import logging
from app.core.config import settings

BACKUP_DIR = settings.BACKUP_DIR


def backup_file(file_path: str) -> str | None:
    os.makedirs(BACKUP_DIR, exist_ok=True)
    filename = os.path.basename(file_path)
    backup_path = os.path.join(BACKUP_DIR, filename)
    if os.path.exists(file_path):
        shutil.copy2(file_path, backup_path)
        logging.info(f"[Backup] Backed up {file_path} -> {backup_path}")
        return backup_path
    logging.warning(f"[Backup] Source file not found: {file_path}")
    return None


def restore_file(file_path: str) -> bool:
    filename = os.path.basename(file_path)
    backup_path = os.path.join(BACKUP_DIR, filename)
    if os.path.exists(backup_path):
        shutil.copy2(backup_path, file_path)
        logging.info(f"[Backup] Restored {backup_path} -> {file_path}")
        return True
    logging.warning(f"[Backup] No backup found for {file_path}")
    return False
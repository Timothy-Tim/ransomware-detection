import asyncio
import logging
from app.services.s3_backup import restore_latest_backup


async def restore_files(task: dict):
    """
    Attempts to restore all infected files from backup.
    Tracks both recovered and failed files on the task dict.
    """
    for file in task.get("infected_files", []):
        success = await asyncio.to_thread(restore_latest_backup, file)
        if success:
            task.setdefault("recovered_files", []).append(file)
        else:
            task.setdefault("failed_files", []).append(file)
            logging.warning(f"[Recovery] No backup found for: {file}")

    logging.info(
        f"[Recovery] Done — recovered: {len(task.get('recovered_files', []))}, "
        f"failed: {len(task.get('failed_files', []))}"
    )
"""
auto_recovery.py — Automated recovery service
Mirrors exactly what the manual /recovery/{id}/start endpoint does.
"""

import asyncio
from app.db.session import SessionLocal
from app.models.recovery import RecoveryTask
from app.models.alert import Alert

AUTO_RECOVERY_ENABLED = True
AUTO_RECOVERY_DELAY   = 30  # seconds before auto-recovering

_pending_tasks: dict[int, asyncio.Task] = {}


async def schedule_auto_recovery(recovery_task_id: int, broadcast_fn):
    print(f"[AutoRecovery] Scheduled for task {recovery_task_id} in {AUTO_RECOVERY_DELAY}s")

    await broadcast_fn({
        "type": "auto_recovery_pending",
        "task_id": recovery_task_id,
        "countdown": AUTO_RECOVERY_DELAY,
        "message": f"Auto-recovery in {AUTO_RECOVERY_DELAY}s. Click Cancel to stop."
    })

    try:
        await asyncio.sleep(AUTO_RECOVERY_DELAY)
        print(f"[AutoRecovery] Starting recovery for task {recovery_task_id}")
        await _execute_recovery(recovery_task_id, broadcast_fn)

    except asyncio.CancelledError:
        print(f"[AutoRecovery] Cancelled for task {recovery_task_id}")
        await broadcast_fn({
            "type": "auto_recovery_cancelled",
            "task_id": recovery_task_id,
            "message": "Auto-recovery was cancelled by admin."
        })

    finally:
        _pending_tasks.pop(recovery_task_id, None)


def start_auto_recovery(recovery_task_id: int, broadcast_fn):
    if not AUTO_RECOVERY_ENABLED:
        return None
    task = asyncio.create_task(
        schedule_auto_recovery(recovery_task_id, broadcast_fn)
    )
    _pending_tasks[recovery_task_id] = task
    return task


def cancel_auto_recovery(recovery_task_id: int) -> bool:
    task = _pending_tasks.get(recovery_task_id)
    if task and not task.done():
        task.cancel()
        return True
    return False


def is_pending(recovery_task_id: int) -> bool:
    task = _pending_tasks.get(recovery_task_id)
    return task is not None and not task.done()


async def _execute_recovery(recovery_task_id: int, broadcast_fn):
    """
    Same logic as the manual POST /recovery/{id}/start endpoint.
    Sets recovering → sends command to agent → sets completed.
    """
    # Import here to avoid circular imports
    from app.api.v1.endpoints.monitor import send_command, connected_clients

    db = SessionLocal()
    try:
        task = db.query(RecoveryTask).filter(RecoveryTask.id == recovery_task_id).first()
        if not task:
            print(f"[AutoRecovery] Task {recovery_task_id} not found")
            return

        if task.status != "pending":
            print(f"[AutoRecovery] Task {recovery_task_id} already {task.status}, skipping")
            return

        host = task.host

        # Check agent is connected
        if host not in connected_clients:
            print(f"[AutoRecovery] Agent {host} not connected — cannot recover")
            await broadcast_fn({
                "type": "auto_recovery_error",
                "task_id": recovery_task_id,
                "message": f"Agent {host} is not connected. Recovery skipped."
            })
            return

        # Mark as recovering
        task.status = "recovering"
        db.commit()

        await broadcast_fn({
            "type": "auto_recovery_started",
            "task_id": recovery_task_id,
            "host": host,
            "files": task.files,
            "message": f"Auto-recovery started for {len(task.files or [])} file(s) on {host}"
        })

        # Send command to agent — same as manual recovery
        success = await send_command(host, {
            "action": "start_recovery",
            "task_id": recovery_task_id,
            "files": task.files or []
        })

        if success:
            task.status = "completed"
            # Resolve all active alerts for this host
            db.query(Alert).filter(
                Alert.host == host,
                Alert.resolved == False
            ).update({"resolved": True, "status": "resolved"})
            db.commit()

            print(f"[AutoRecovery] Task {recovery_task_id} completed")
            await broadcast_fn({
                "type": "auto_recovery_completed",
                "task_id": recovery_task_id,
                "host": host,
                "message": f"Auto-recovery completed for {host}"
            })
        else:
            # Agent command failed — revert to pending
            task.status = "pending"
            db.commit()
            print(f"[AutoRecovery] Command failed for task {recovery_task_id}")
            await broadcast_fn({
                "type": "auto_recovery_error",
                "task_id": recovery_task_id,
                "message": "Failed to send recovery command to agent."
            })

    except Exception as e:
        print(f"[AutoRecovery] Error: {e}")
        await broadcast_fn({
            "type": "auto_recovery_error",
            "task_id": recovery_task_id,
            "message": f"Auto-recovery error: {str(e)}"
        })
    finally:
        db.close()
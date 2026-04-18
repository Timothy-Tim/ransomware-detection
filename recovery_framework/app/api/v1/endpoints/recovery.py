from fastapi import APIRouter, Depends
from app.db.session import SessionLocal
from app.models.alert import Alert
from app.models.recovery import RecoveryTask
from app.api.v1.endpoints.monitor import send_command, connected_clients
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/tasks")
def get_recovery_tasks(current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        tasks = db.query(RecoveryTask).order_by(RecoveryTask.id.desc()).all()
        return [
            {
                "id": t.id,
                "host": t.host,
                "files": t.files,
                "malware": t.malware,
                "status": t.status
            }
            for t in tasks
        ]
    finally:
        db.close()

@router.post("/{id}/start")
async def start_recovery(id: int, current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        task = db.query(RecoveryTask).filter(RecoveryTask.id == id).first()
        if not task:
            return {"error": "Task not found"}

        host = task.host
        if host not in connected_clients:
            return {"error": f"Agent {host} not connected"}

        task.status = "recovering"
        db.commit()

        success = await send_command(host, {
            "action": "start_recovery",
            "task_id": id,
            "files": task.files or []
        })

        if success:
            task.status = "completed"

            # ✅ Mark all alerts for this host as resolved
            db.query(Alert).filter(
                Alert.host == host,
                Alert.resolved == False
            ).update({"resolved": True, "status": "resolved"})

            db.commit()
            return {"status": "recovery started"}

        task.status = "pending"
        db.commit()
        return {"error": "Failed to send command"}
    finally:
        db.close()
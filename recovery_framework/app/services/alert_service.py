from app.db.session import SessionLocal
from app.models.alert import Alert
from app.models.recovery import RecoveryTask

def create_alert(host: str, file: str = "", reason: str = ""):
    db = SessionLocal()
    try:
        # Create alert
        alert = Alert(
            host=host,
            severity="high",
            status="active",
            file=file,
            reason=reason
        )
        db.add(alert)
        db.flush()  # get alert.id before commit

        # Find existing pending task for this host
        existing_task = db.query(RecoveryTask).filter(
            RecoveryTask.host == host,
            RecoveryTask.status == "pending"
        ).first()

        if existing_task:
            # Add file to existing task
            files = list(existing_task.files or [])
            if file and file not in files:
                files.append(file)
            existing_task.files = files
            existing_task.malware = reason
        else:
            # Create new task
            task = RecoveryTask(
                host=host,
                files=[file] if file else [],
                malware=reason,
                status="pending"
            )
            db.add(task)

        db.commit()
        db.refresh(alert)
        return alert
    finally:
        db.close()
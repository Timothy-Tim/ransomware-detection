from fastapi import APIRouter, Depends
from app.db.session import SessionLocal
from app.models.alert import Alert
from app.models.recovery import RecoveryTask
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/")
def get_dashboard(current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        total_alerts = db.query(Alert).count()
        active_alerts = db.query(Alert).filter(Alert.resolved == False).count()
        recovering = db.query(RecoveryTask).filter(RecoveryTask.status == "recovering").count()
        return {
            "total_alerts": total_alerts,
            "active_alerts": active_alerts,
            "recovering": recovering
        }
    finally:
        db.close()
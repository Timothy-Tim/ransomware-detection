from fastapi import APIRouter, Depends
from app.db.session import SessionLocal
from app.models.alert import Alert
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("")
def get_alerts(current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        alerts = db.query(Alert).order_by(Alert.id.desc()).all()
        return [
            {
                "id": a.id,
                "host": a.host,
                "severity": a.severity,
                "status": a.status,
                "file": a.file,
                "reason": a.reason,
                "timestamp": a.timestamp,
                "resolved": a.resolved
            }
            for a in alerts
        ]
    finally:
        db.close()
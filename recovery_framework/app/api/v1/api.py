from fastapi import APIRouter, Depends
from app.api.v1.endpoints import agent, monitor, auth, alerts, recovery, backup, dashboard
from app.api.v1.endpoints.auth import get_current_user
from app.api.v1.endpoints import recovery, backup

api_router = APIRouter()

# Public
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Monitor — no router-level auth
api_router.include_router(monitor.router, prefix="/monitor", tags=["monitor"])

# Protected
api_router.include_router(
    alerts.router, prefix="/alerts", tags=["alerts"],
    dependencies=[Depends(get_current_user)]
)
api_router.include_router(
    agent.router, prefix="/agent", tags=["agent"],
    dependencies=[Depends(get_current_user)]
)
api_router.include_router(
    recovery.router, prefix="/recovery", tags=["recovery"],
    dependencies=[Depends(get_current_user)]
)
api_router.include_router(
    backup.router, prefix="/backup", tags=["backup"],
    dependencies=[Depends(get_current_user)]
)

api_router.include_router(
    dashboard.router,prefix="/dashboard",tags=["dashboard"],
    dependencies=[Depends(get_current_user)]
)
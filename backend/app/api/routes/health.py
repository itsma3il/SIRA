"""Health and readiness endpoints."""
from fastapi import APIRouter
from app.utils.monitoring import SystemMonitor, performance_monitor

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def liveness() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def readiness() -> dict[str, str]:
    # In future, add DB and dependency checks here.
    return {"status": "ready"}


@router.get("/system")
async def system_health():
    """Detailed system health metrics."""
    monitor = SystemMonitor()
    return monitor.get_system_health()


@router.get("/performance")
async def performance_metrics():
    """Application performance metrics."""
    return performance_monitor.get_metrics()


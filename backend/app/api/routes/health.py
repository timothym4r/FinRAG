from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.api.routes.shared import SettingsDep, DbDep
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(
    settings: SettingsDep,
    db: DbDep,
) -> HealthResponse:
    db.execute(text("SELECT 1"))
    return HealthResponse(
        status="ok",
        environment=settings.env,
        version="0.1.0",
        database="connected",
        upload_dir=str(settings.resolved_upload_dir),
    )

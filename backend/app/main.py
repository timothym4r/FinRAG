from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette import status

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.database import SessionLocal, init_db
from app.core.errors import AppError
from app.core.logging import add_request_logging_middleware, configure_logging, get_logger
from app.schemas.error import ErrorResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = app.state.settings
    settings.resolved_upload_dir.mkdir(parents=True, exist_ok=True)
    settings.resolved_qdrant_local_path.mkdir(parents=True, exist_ok=True)
    if settings.database_url.startswith("sqlite:///"):
        database_path = Path(settings.database_url.replace("sqlite:///", "", 1))
        database_path.parent.mkdir(parents=True, exist_ok=True)
    init_db(getattr(app.state, "db_engine", None))
    get_logger("finrag.startup").info(
        "application_started",
        extra={"stage": "startup"},
    )
    yield


def create_app(settings: Optional[Settings] = None) -> FastAPI:
    configure_logging()
    app_settings = settings or get_settings()

    app = FastAPI(
        title="FinRAG API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.state.settings = app_settings
    app.state.db_engine = None
    app.state.session_factory = SessionLocal
    app.dependency_overrides[get_settings] = lambda: app_settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    add_request_logging_middleware(app)

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        get_logger("finrag.errors").warning(
            "application_error",
            extra={
                "request_id": getattr(request.state, "request_id", None),
                "stage": "app_error",
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(error=exc.code, message=exc.message, details=exc.details).model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        get_logger("finrag.errors").warning(
            "validation_error",
            extra={
                "request_id": getattr(request.state, "request_id", None),
                "stage": "validation_error",
            },
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ErrorResponse(
                error="validation_error",
                message="Request validation failed.",
                details={"errors": exc.errors()},
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        get_logger("finrag.errors").exception(
            "unhandled_exception",
            extra={"request_id": getattr(request.state, "request_id", None)},
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                error="internal_server_error",
                message="An unexpected error occurred.",
            ).model_dump(),
        )

    app.include_router(api_router)
    return app


app = create_app()

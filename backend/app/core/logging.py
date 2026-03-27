import json
import logging
import time
from collections.abc import Callable
from uuid import uuid4

from fastapi import FastAPI, Request, Response


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for key in (
            "request_id",
            "path",
            "method",
            "status_code",
            "duration_ms",
            "document_id",
            "stage",
            "chunk_count",
            "page_count",
        ):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def configure_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def add_request_logging_middleware(app: FastAPI) -> None:
    logger = get_logger("finrag.api")

    @app.middleware("http")
    async def log_requests(
        request: Request,
        call_next: Callable[[Request], Response],
    ) -> Response:
        request_id = str(uuid4())
        request.state.request_id = request_id
        start = time.perf_counter()

        response = await call_next(request)

        logger.info(
            "request_completed",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status_code": response.status_code,
                "duration_ms": round((time.perf_counter() - start) * 1000, 2),
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response

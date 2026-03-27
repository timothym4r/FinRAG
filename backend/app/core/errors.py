from http import HTTPStatus
from typing import Any, Optional


class AppError(Exception):
    status_code = HTTPStatus.INTERNAL_SERVER_ERROR
    code = "internal_error"

    def __init__(self, message: str, *, details: Optional[dict[str, Any]] = None) -> None:
        self.message = message
        self.details = details or {}
        super().__init__(message)


class NotFoundError(AppError):
    status_code = HTTPStatus.NOT_FOUND
    code = "not_found"


class FileStorageError(AppError):
    status_code = HTTPStatus.INTERNAL_SERVER_ERROR
    code = "storage_error"


class InvalidUploadError(AppError):
    status_code = HTTPStatus.BAD_REQUEST
    code = "invalid_upload"


class IngestionError(AppError):
    status_code = HTTPStatus.INTERNAL_SERVER_ERROR
    code = "ingestion_error"


class EmbeddingError(AppError):
    status_code = HTTPStatus.INTERNAL_SERVER_ERROR
    code = "embedding_error"


class VectorStoreError(AppError):
    status_code = HTTPStatus.INTERNAL_SERVER_ERROR
    code = "vector_store_error"

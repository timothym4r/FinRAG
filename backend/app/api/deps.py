from collections.abc import Generator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.config import Settings, get_settings
from app.services.documents import DocumentService
from app.services.storage import LocalFileStorage, StorageService


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_storage_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> StorageService:
    return LocalFileStorage(base_dir=settings.resolved_upload_dir)


def get_document_service(
    db: Annotated[Session, Depends(get_db)],
    storage: Annotated[StorageService, Depends(get_storage_service)],
) -> DocumentService:
    return DocumentService(db=db, storage=storage)

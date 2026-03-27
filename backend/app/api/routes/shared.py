from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import Settings, get_settings
from app.services.documents import DocumentService
from app.services.storage import StorageService

SettingsDep = Annotated[Settings, Depends(get_settings)]
DbDep = Annotated[Session, Depends(deps.get_db)]
StorageDep = Annotated[StorageService, Depends(deps.get_storage_service)]
DocumentServiceDep = Annotated[DocumentService, Depends(deps.get_document_service)]


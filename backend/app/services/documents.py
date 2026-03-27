from datetime import date
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.models.document import Document, DocumentStatus, FilingType
from app.services.storage import StorageService


class DocumentService:
    def __init__(self, *, db: Session, storage: StorageService) -> None:
        self.db = db
        self.storage = storage

    def create_document(
        self,
        *,
        file: UploadFile,
        company: str,
        filing_type: FilingType,
        filing_date: date,
        initial_status: DocumentStatus,
    ) -> Document:
        stored_path = self.storage.save(file)
        document = Document(
            filename=file.filename or Path(stored_path).name,
            company=company,
            filing_type=filing_type,
            filing_date=filing_date,
            status=initial_status,
            storage_path=str(stored_path),
        )
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def list_documents(self) -> list[Document]:
        stmt = select(Document).order_by(Document.created_at.desc())
        return list(self.db.scalars(stmt))

    def get_document(self, document_id: UUID) -> Document:
        document = self.db.get(Document, str(document_id))
        if document is None:
            raise NotFoundError(f"Document '{document_id}' was not found.")
        return document

    def delete_document(self, document_id: UUID) -> None:
        document = self.get_document(document_id)
        self.storage.delete(document.storage_path)
        self.db.delete(document)
        self.db.commit()


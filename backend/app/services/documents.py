from datetime import date
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.core.config import Settings
from app.models.chunk import DocumentChunk
from app.models.document import Document, DocumentStatus, FilingType
from app.services.embeddings.factory import create_embedding_provider
from app.services.storage import StorageService
from app.services.vector_store import QdrantVectorStore


class DocumentService:
    def __init__(self, *, db: Session, storage: StorageService, settings: Settings) -> None:
        self.db = db
        self.storage = storage
        self.settings = settings

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
        documents = list(self.db.scalars(stmt))
        self._attach_chunk_counts(documents)
        return documents

    def get_document(self, document_id: UUID) -> Document:
        document = self.db.get(Document, str(document_id))
        if document is None:
            raise NotFoundError(f"Document '{document_id}' was not found.")
        self._attach_chunk_counts([document])
        return document

    def delete_document(self, document_id: UUID) -> None:
        document = self.get_document(document_id)
        if document.status == DocumentStatus.INDEXED:
            embedding_provider = create_embedding_provider(self.settings)
            vector_store = QdrantVectorStore(
                settings=self.settings,
                vector_size=embedding_provider.dimension,
            )
            vector_store.ensure_collection()
            vector_store.delete_document_points(document.id)
        self.db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document.id))
        self.storage.delete(document.storage_path)
        self.db.delete(document)
        self.db.commit()

    def _attach_chunk_counts(self, documents: list[Document]) -> None:
        if not documents:
            return

        counts = {
            document_id: chunk_count
            for document_id, chunk_count in self.db.execute(
                select(DocumentChunk.document_id, func.count(DocumentChunk.id))
                .where(DocumentChunk.document_id.in_([document.id for document in documents]))
                .group_by(DocumentChunk.document_id)
            )
        }
        for document in documents:
            document.chunk_count = counts.get(document.id, 0)

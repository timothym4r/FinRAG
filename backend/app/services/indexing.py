from dataclasses import dataclass
from time import sleep

from qdrant_client import models as qdrant_models
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import EmbeddingError, IngestionError, NotFoundError, VectorStoreError
from app.core.logging import get_logger
from app.models.chunk import DocumentChunk
from app.models.document import Document, DocumentStatus
from app.services.embeddings.base import EmbeddingProvider
from app.services.embeddings.factory import create_embedding_provider
from app.services.vector_store import QdrantVectorStore

logger = get_logger("finrag.indexing")


@dataclass
class VectorPayload:
    point_id: str
    vector: list[float]
    payload: dict[str, object]


class IndexingService:
    def __init__(self, *, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings
        self.embedding_provider: EmbeddingProvider = create_embedding_provider(settings)
        self.vector_store = QdrantVectorStore(
            settings=settings,
            vector_size=self.embedding_provider.dimension,
        )

    def index_document(self, document_id: str, *, force_reindex: bool = False) -> Document:
        document = self.db.get(Document, document_id)
        if document is None:
            raise NotFoundError(f"Document '{document_id}' was not found.")

        chunks = list(
            self.db.scalars(
                select(DocumentChunk)
                .where(DocumentChunk.document_id == document.id)
                .order_by(DocumentChunk.chunk_index.asc())
            )
        )
        if not chunks:
            raise IngestionError("Cannot index a document before chunks are created.")

        try:
            self.vector_store.ensure_collection()
            if force_reindex or document.status == DocumentStatus.INDEXED:
                self.vector_store.delete_document_points(document.id)

            self._log_status(document, DocumentStatus.PROCESSING, "indexing_started")

            for batch_start in range(0, len(chunks), self.settings.embedding_batch_size):
                batch = chunks[batch_start : batch_start + self.settings.embedding_batch_size]
                embeddings = self._with_retries(
                    lambda current_batch=batch: self.embedding_provider.embed_texts(
                        [chunk.content for chunk in current_batch]
                    ),
                    stage="embedding_batch",
                    document_id=document.id,
                )
                points = self._build_points(document, batch, embeddings)
                self._with_retries(
                    lambda current_points=points: self.vector_store.upsert_points(current_points),
                    stage="vector_upsert",
                    document_id=document.id,
                )

            document.status = DocumentStatus.INDEXED
            self.db.commit()
            self.db.refresh(document)
            document.chunk_count = len(chunks)
            logger.info(
                "indexing_completed",
                extra={
                    "document_id": document.id,
                    "stage": "indexing_completed",
                    "chunk_count": len(chunks),
                },
            )
            return document
        except Exception:
            self.db.rollback()
            failed_document = self.db.get(Document, document_id)
            if failed_document is not None:
                failed_document.status = DocumentStatus.FAILED
                self.db.commit()
            logger.exception(
                "indexing_failed",
                extra={"document_id": document_id, "stage": "indexing_failed"},
            )
            raise

    def _build_points(
        self,
        document: Document,
        chunks: list[DocumentChunk],
        embeddings: list[list[float]],
    ) -> list[qdrant_models.PointStruct]:
        points: list[qdrant_models.PointStruct] = []
        for chunk, vector in zip(chunks, embeddings):
            points.append(
                qdrant_models.PointStruct(
                    id=chunk.id,
                    vector=vector,
                    payload={
                        "document_id": document.id,
                        "chunk_id": chunk.id,
                        "section": chunk.section,
                        "page": chunk.page,
                        "chunk_index": chunk.chunk_index,
                        "company": document.company,
                        "filing_type": document.filing_type.value,
                        "filing_date": document.filing_date.isoformat(),
                        "filename": document.filename,
                        "content": chunk.content,
                    },
                )
            )
        return points

    def _with_retries(self, operation, *, stage: str, document_id: str):
        last_error = None
        for attempt in range(1, self.settings.embedding_max_retries + 1):
            try:
                return operation()
            except (EmbeddingError, VectorStoreError) as exc:
                last_error = exc
            except Exception as exc:
                last_error = exc

            logger.warning(
                "indexing_retry",
                extra={"document_id": document_id, "stage": stage},
            )
            if attempt < self.settings.embedding_max_retries:
                sleep(0.2 * attempt)

        if isinstance(last_error, VectorStoreError):
            raise last_error
        if isinstance(last_error, EmbeddingError):
            raise last_error
        if stage == "vector_upsert":
            raise VectorStoreError("Exceeded retry budget while writing vectors.") from last_error
        raise EmbeddingError("Exceeded retry budget while generating embeddings.") from last_error

    def _log_status(self, document: Document, status: DocumentStatus, stage: str) -> None:
        document.status = status
        self.db.commit()
        self.db.refresh(document)
        logger.info(
            "document_status_updated",
            extra={"document_id": document.id, "stage": stage},
        )

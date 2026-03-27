from typing import Callable

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.logging import get_logger
from app.services.ingestion import IngestionService
from app.services.indexing import IndexingService

logger = get_logger("finrag.background")


def process_document_ingestion(
    document_id: str,
    session_factory: Callable[[], Session],
    settings: Settings,
) -> None:
    db = session_factory()
    try:
        logger.info(
            "background_ingestion_started",
            extra={"document_id": document_id, "stage": "background_dispatch"},
        )
        IngestionService(db=db, settings=settings).process_document(document_id)
        IndexingService(db=db, settings=settings).index_document(document_id)
    except Exception:
        logger.exception(
            "background_ingestion_failed",
            extra={"document_id": document_id, "stage": "background_dispatch"},
        )
    finally:
        db.close()


def process_document_reindex(
    document_id: str,
    session_factory: Callable[[], Session],
    settings: Settings,
) -> None:
    db = session_factory()
    try:
        logger.info(
            "background_reindex_started",
            extra={"document_id": document_id, "stage": "background_reindex_dispatch"},
        )
        IndexingService(db=db, settings=settings).index_document(document_id, force_reindex=True)
    except Exception:
        logger.exception(
            "background_reindex_failed",
            extra={"document_id": document_id, "stage": "background_reindex_dispatch"},
        )
    finally:
        db.close()

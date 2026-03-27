import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from pypdf import PdfReader
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import IngestionError, InvalidUploadError
from app.core.logging import get_logger
from app.models.chunk import DocumentChunk
from app.models.document import Document, DocumentStatus

logger = get_logger("finrag.ingestion")


@dataclass
class ExtractedPage:
    page_number: int
    text: str


@dataclass
class ChunkPayload:
    section: str
    page: int
    chunk_index: int
    content: str


SECTION_PATTERNS = [
    (re.compile(r"item\s+1a\.?\s+risk factors", re.IGNORECASE), "Risk Factors"),
    (re.compile(r"^risk factors$", re.IGNORECASE), "Risk Factors"),
    (
        re.compile(
            r"(management'?s discussion and analysis|management discussion and analysis|md&a)",
            re.IGNORECASE,
        ),
        "MD&A",
    ),
    (
        re.compile(
            r"(financial statements|consolidated statements|condensed consolidated statements)",
            re.IGNORECASE,
        ),
        "Financial Statements",
    ),
    (
        re.compile(
            r"(notes to (the )?(condensed )?consolidated financial statements|notes to consolidated financial statements)",
            re.IGNORECASE,
        ),
        "Notes",
    ),
    (
        re.compile(r"(quantitative and qualitative disclosures about market risk)", re.IGNORECASE),
        "Market Risk",
    ),
    (re.compile(r"(controls and procedures)", re.IGNORECASE), "Controls and Procedures"),
]


class FinancialSectionDetector:
    def detect(self, line: str, current_section: str) -> str:
        normalized = " ".join(line.split())
        for pattern, label in SECTION_PATTERNS:
            if pattern.search(normalized):
                return label
        return current_section


class TextExtractor:
    def extract(self, storage_path: str) -> list[ExtractedPage]:
        path = Path(storage_path)
        suffix = path.suffix.lower()

        if suffix == ".pdf":
            return self._extract_pdf(path)
        if suffix in {".txt", ".text", ".md"}:
            return self._extract_text(path)

        raise InvalidUploadError(f"Unsupported file type '{suffix or 'unknown'}'.")

    def _extract_pdf(self, path: Path) -> list[ExtractedPage]:
        try:
            reader = PdfReader(str(path))
        except Exception as exc:
            raise IngestionError("Failed to open PDF document for extraction.") from exc

        pages: list[ExtractedPage] = []
        for index, page in enumerate(reader.pages, start=1):
            try:
                text = page.extract_text() or ""
            except Exception as exc:
                raise IngestionError(f"Failed to extract text from PDF page {index}.") from exc
            pages.append(ExtractedPage(page_number=index, text=text))
        return pages

    def _extract_text(self, path: Path) -> list[ExtractedPage]:
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = path.read_text(encoding="latin-1")
        except OSError as exc:
            raise IngestionError("Failed to read uploaded text document.") from exc
        return [ExtractedPage(page_number=1, text=text)]


class ChunkBuilder:
    def __init__(self, *, chunk_size: int, chunk_overlap: int) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def build(self, pages: Iterable[ExtractedPage]) -> list[ChunkPayload]:
        detector = FinancialSectionDetector()
        section_buffers: list[tuple[str, int, str]] = []
        current_section = "General"

        for page in pages:
            lines = [line.strip() for line in page.text.splitlines()]
            local_buffer: list[str] = []
            local_section = current_section

            for line in lines:
                if not line:
                    continue

                detected_section = detector.detect(line, local_section)
                if detected_section != local_section and local_buffer:
                    section_buffers.append((local_section, page.page_number, " ".join(local_buffer).strip()))
                    local_buffer = []
                local_section = detected_section
                local_buffer.append(line)

            if local_buffer:
                section_buffers.append((local_section, page.page_number, " ".join(local_buffer).strip()))
            current_section = local_section

        chunks: list[ChunkPayload] = []
        chunk_index = 0
        for section, page_number, text in section_buffers:
            if not text:
                continue
            for chunk_text in self._chunk_text(text):
                chunks.append(
                    ChunkPayload(
                        section=section,
                        page=page_number,
                        chunk_index=chunk_index,
                        content=chunk_text,
                    )
                )
                chunk_index += 1

        return chunks

    def _chunk_text(self, text: str) -> list[str]:
        normalized = " ".join(text.split())
        if not normalized:
            return []
        if len(normalized) <= self.chunk_size:
            return [normalized]

        chunks: list[str] = []
        start = 0
        text_length = len(normalized)
        while start < text_length:
            end = min(text_length, start + self.chunk_size)
            if end < text_length:
                boundary = normalized.rfind(" ", start, end)
                if boundary > start:
                    end = boundary

            chunk = normalized[start:end].strip()
            if chunk:
                chunks.append(chunk)
            if end >= text_length:
                break
            start = max(0, end - self.chunk_overlap)
        return chunks


class IngestionService:
    def __init__(self, *, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings
        self.extractor = TextExtractor()
        self.chunk_builder = ChunkBuilder(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )

    def process_document(self, document_id: str) -> Document:
        document = self.db.get(Document, document_id)
        if document is None:
            raise IngestionError(f"Document '{document_id}' does not exist for ingestion.")

        try:
            self._set_status(document, DocumentStatus.PROCESSING, "processing_started")

            pages = self.extractor.extract(document.storage_path)
            logger.info(
                "text_extracted",
                extra={
                    "document_id": document.id,
                    "stage": "text_extraction",
                    "page_count": len(pages),
                },
            )

            chunks = self.chunk_builder.build(pages)
            if not chunks:
                raise IngestionError("No textual chunks were produced from the uploaded document.")

            self.db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document.id))
            self.db.add_all(
                [
                    DocumentChunk(
                        document_id=document.id,
                        section=chunk.section,
                        page=chunk.page,
                        chunk_index=chunk.chunk_index,
                        content=chunk.content,
                    )
                    for chunk in chunks
                ]
            )

            document.status = DocumentStatus.CHUNKED
            self.db.commit()
            self.db.refresh(document)
            document.chunk_count = len(chunks)
            logger.info(
                "chunking_completed",
                extra={
                    "document_id": document.id,
                    "stage": "chunking",
                    "chunk_count": len(chunks),
                },
            )
            return document
        except Exception as exc:
            self.db.rollback()
            failed_document = self.db.get(Document, document_id)
            if failed_document is not None:
                failed_document.status = DocumentStatus.FAILED
                self.db.commit()
            logger.exception(
                "ingestion_failed",
                extra={"document_id": document_id, "stage": "failed"},
            )
            if isinstance(exc, (IngestionError, InvalidUploadError)):
                raise
            raise IngestionError("Document ingestion failed unexpectedly.") from exc

    def _set_status(self, document: Document, status: DocumentStatus, stage: str) -> None:
        document.status = status
        self.db.commit()
        self.db.refresh(document)
        logger.info(
            "document_status_updated",
            extra={"document_id": document.id, "stage": stage},
        )

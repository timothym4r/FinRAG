from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.document import DocumentStatus, FilingType
from app.schemas.chunk import ChunkResponse


class DocumentSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    company: str
    filing_type: FilingType
    filing_date: date
    status: DocumentStatus
    created_at: datetime
    chunk_count: int = 0


class DocumentDetailResponse(DocumentSummaryResponse):
    chunks: list[ChunkResponse] = []


class DocumentListResponse(BaseModel):
    items: list[DocumentSummaryResponse]

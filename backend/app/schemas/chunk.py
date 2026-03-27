from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChunkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    section: str
    page: int
    chunk_index: int
    content: str
    created_at: datetime

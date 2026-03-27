from typing import Optional

from pydantic import BaseModel, Field


class QAQueryRequest(BaseModel):
    query: str = Field(min_length=3)
    top_k: int = Field(default=5, ge=1, le=20)
    document_id: Optional[str] = None
    company: Optional[str] = None


class RetrievedChunkResponse(BaseModel):
    chunk_id: str
    document_id: str
    section: str
    page: int
    chunk_index: int
    score: float
    rerank_score: float
    company: str
    filing_type: str
    filing_date: str
    filename: str
    content: str


class QAResponse(BaseModel):
    answer: str
    citations: list[str]
    retrieved_chunks: list[RetrievedChunkResponse]
    confidence: float
    explanation: str

import re
from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import NotFoundError
from app.core.logging import get_logger
from app.models.document import Document
from app.schemas.qa import QAResponse, RetrievedChunkResponse
from app.services.embeddings.factory import create_embedding_provider
from app.services.rerankers.factory import create_reranker
from app.services.vector_store import RetrievedPoint, SearchFilter, QdrantVectorStore

logger = get_logger("finrag.qa")


@dataclass
class RankedChunk:
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


class GroundedAnswerGenerator:
    def generate(self, query: str, ranked_chunks: list[RankedChunk], *, min_score: float) -> QAResponse:
        if not ranked_chunks:
            return QAResponse(
                answer="I could not answer from the indexed documents because no relevant evidence was retrieved.",
                citations=[],
                retrieved_chunks=[],
                confidence=0.0,
                explanation="No chunks matched the query strongly enough to support a grounded answer.",
            )

        usable_chunks = [chunk for chunk in ranked_chunks if max(chunk.score, chunk.rerank_score) >= min_score]
        if not usable_chunks:
            retrieved = [self._to_response(chunk) for chunk in ranked_chunks]
            return QAResponse(
                answer="I found related chunks, but the evidence is too weak to answer confidently without guessing.",
                citations=[],
                retrieved_chunks=retrieved,
                confidence=0.12,
                explanation="Retrieved chunks had weak relevance, so the system is intentionally declining to infer beyond the source text.",
            )

        top_chunks = usable_chunks[:3]
        answer_sentences = [self._best_sentence_for_query(query, chunk.content) for chunk in top_chunks]
        citations = [chunk.chunk_id for chunk in top_chunks]
        confidence = min(
            0.98,
            round(
                0.35
                + sum((chunk.score + chunk.rerank_score) / 2 for chunk in top_chunks) / max(len(top_chunks), 1),
                2,
            ),
        )

        return QAResponse(
            answer=" ".join(answer_sentences),
            citations=citations,
            retrieved_chunks=[self._to_response(chunk) for chunk in ranked_chunks],
            confidence=confidence,
            explanation=(
                "The answer is composed only from retrieved chunks after dense retrieval and overlap-based reranking. "
                "Higher confidence reflects stronger agreement between vector similarity and rerank relevance."
            ),
        )

    def _best_sentence_for_query(self, query: str, content: str) -> str:
        sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", content) if sentence.strip()]
        if not sentences:
            return content

        query_terms = {term.lower() for term in re.findall(r"[a-zA-Z0-9]+", query)}

        def score(sentence: str) -> tuple[int, int]:
            tokens = re.findall(r"[a-zA-Z0-9]+", sentence.lower())
            overlap = sum(1 for token in tokens if token in query_terms)
            return overlap, len(tokens)

        best_sentence = max(sentences, key=score)
        return best_sentence

    def _to_response(self, chunk: RankedChunk) -> RetrievedChunkResponse:
        return RetrievedChunkResponse(
            chunk_id=chunk.chunk_id,
            document_id=chunk.document_id,
            section=chunk.section,
            page=chunk.page,
            chunk_index=chunk.chunk_index,
            score=round(chunk.score, 4),
            rerank_score=round(chunk.rerank_score, 4),
            company=chunk.company,
            filing_type=chunk.filing_type,
            filing_date=chunk.filing_date,
            filename=chunk.filename,
            content=chunk.content,
        )


class RetrievalQAService:
    def __init__(self, *, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings
        self.embedding_provider = create_embedding_provider(settings)
        self.reranker = create_reranker(settings)
        self.vector_store = QdrantVectorStore(
            settings=settings,
            vector_size=self.embedding_provider.dimension,
        )
        self.answer_generator = GroundedAnswerGenerator()

    def answer_query(
        self,
        *,
        query: str,
        top_k: int,
        document_id: Optional[str] = None,
        company: Optional[str] = None,
    ) -> QAResponse:
        if document_id:
            document = self.db.get(Document, document_id)
            if document is None:
                raise NotFoundError(f"Document '{document_id}' was not found.")

        self.vector_store.ensure_collection()
        query_embedding = self.embedding_provider.embed_texts([query])[0]
        search_filter = SearchFilter(document_id=document_id, company=company)
        retrieved = self.vector_store.search(
            query_vector=query_embedding,
            limit=max(top_k, self.settings.retrieval_top_k),
            search_filter=search_filter,
        )

        ranked = self._rerank(query, retrieved)
        logger.info(
            "qa_completed",
            extra={
                "stage": "qa_completed",
                "chunk_count": len(ranked),
            },
        )
        answer_limit = min(top_k, self.settings.rerank_top_n)
        return self.answer_generator.generate(
            query,
            ranked[:answer_limit],
            min_score=self.settings.retrieval_min_score,
        )

    def _rerank(self, query: str, retrieved: list[RetrievedPoint]) -> list[RankedChunk]:
        if not retrieved:
            return []

        rerank_scores = self.reranker.rerank(query, [point.content for point in retrieved])
        ranked = [
            RankedChunk(
                chunk_id=point.chunk_id,
                document_id=point.document_id,
                section=point.section,
                page=point.page,
                chunk_index=point.chunk_index,
                score=point.score,
                rerank_score=rerank_score,
                company=point.company,
                filing_type=point.filing_type,
                filing_date=point.filing_date,
                filename=point.filename,
                content=point.content,
            )
            for point, rerank_score in zip(retrieved, rerank_scores)
        ]
        return sorted(
            ranked,
            key=lambda chunk: (chunk.rerank_score, chunk.score),
            reverse=True,
        )

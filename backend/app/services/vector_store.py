from dataclasses import dataclass
from typing import Optional

from qdrant_client import QdrantClient, models

from app.core.config import Settings
from app.core.errors import VectorStoreError


DISTANCE_MAP = {
    "cosine": models.Distance.COSINE,
    "dot": models.Distance.DOT,
    "euclid": models.Distance.EUCLID,
}


@dataclass
class SearchFilter:
    document_id: Optional[str] = None
    company: Optional[str] = None


@dataclass
class RetrievedPoint:
    chunk_id: str
    document_id: str
    section: str
    page: int
    chunk_index: int
    score: float
    company: str
    filing_type: str
    filing_date: str
    filename: str
    content: str


class QdrantVectorStore:
    def __init__(self, *, settings: Settings, vector_size: int) -> None:
        self.settings = settings
        self.vector_size = vector_size
        self.collection_name = settings.qdrant_collection
        self.client = self._create_client()

    def _create_client(self) -> QdrantClient:
        if self.settings.qdrant_url:
            return QdrantClient(
                url=self.settings.qdrant_url,
                api_key=self.settings.qdrant_api_key or None,
            )
        self.settings.resolved_qdrant_local_path.mkdir(parents=True, exist_ok=True)
        return QdrantClient(
            path=str(self.settings.resolved_qdrant_local_path),
            force_disable_check_same_thread=True,
        )

    def ensure_collection(self) -> None:
        try:
            exists = self.client.collection_exists(collection_name=self.collection_name)
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=self.vector_size,
                        distance=DISTANCE_MAP.get(
                            self.settings.vector_distance.lower(),
                            models.Distance.COSINE,
                        ),
                    ),
                )
        except Exception as exc:
            raise VectorStoreError("Failed to prepare Qdrant collection.") from exc

    def delete_document_points(self, document_id: str) -> None:
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="document_id",
                                match=models.MatchValue(value=document_id),
                            )
                        ]
                    )
                ),
            )
        except Exception as exc:
            raise VectorStoreError("Failed to delete existing vectors for document.") from exc

    def upsert_points(self, points: list[models.PointStruct]) -> None:
        try:
            self.client.upsert(collection_name=self.collection_name, points=points)
        except Exception as exc:
            raise VectorStoreError("Failed to upsert vectors into Qdrant.") from exc

    def search(
        self,
        *,
        query_vector: list[float],
        limit: int,
        search_filter: Optional[SearchFilter] = None,
    ) -> list[RetrievedPoint]:
        qdrant_filter = None
        if search_filter:
            must_filters = []
            if search_filter.document_id:
                must_filters.append(
                    models.FieldCondition(
                        key="document_id",
                        match=models.MatchValue(value=search_filter.document_id),
                    )
                )
            if search_filter.company:
                must_filters.append(
                    models.FieldCondition(
                        key="company",
                        match=models.MatchValue(value=search_filter.company),
                    )
                )
            if must_filters:
                qdrant_filter = models.Filter(must=must_filters)

        try:
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=qdrant_filter,
                limit=limit,
                with_payload=True,
            ).points
        except Exception as exc:
            raise VectorStoreError("Failed to query vectors from Qdrant.") from exc

        retrieved: list[RetrievedPoint] = []
        for point in results:
            payload = point.payload or {}
            retrieved.append(
                RetrievedPoint(
                    chunk_id=str(payload["chunk_id"]),
                    document_id=str(payload["document_id"]),
                    section=str(payload["section"]),
                    page=int(payload["page"]),
                    chunk_index=int(payload["chunk_index"]),
                    score=float(point.score or 0.0),
                    company=str(payload["company"]),
                    filing_type=str(payload["filing_type"]),
                    filing_date=str(payload["filing_date"]),
                    filename=str(payload["filename"]),
                    content=str(payload["content"]),
                )
            )
        return retrieved

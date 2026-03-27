from app.core.config import Settings
from app.core.errors import EmbeddingError
from app.services.rerankers.base import Reranker
from app.services.rerankers.local_overlap import LocalOverlapReranker


def create_reranker(settings: Settings) -> Reranker:
    provider_name = settings.rerank_provider.lower().strip()

    if provider_name == "local_overlap":
        return LocalOverlapReranker()

    raise EmbeddingError(f"Unsupported reranker provider '{settings.rerank_provider}'.")

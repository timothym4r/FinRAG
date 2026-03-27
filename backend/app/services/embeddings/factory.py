from app.core.config import Settings
from app.core.errors import EmbeddingError
from app.services.embeddings.base import EmbeddingProvider
from app.services.embeddings.local_hash import LocalHashEmbeddingProvider


def create_embedding_provider(settings: Settings) -> EmbeddingProvider:
    provider_name = settings.embedding_provider.lower().strip()

    if provider_name == "local_hash":
        return LocalHashEmbeddingProvider(dimension=settings.embedding_dimension)

    raise EmbeddingError(f"Unsupported embedding provider '{settings.embedding_provider}'.")

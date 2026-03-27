import hashlib

from app.services.embeddings.base import EmbeddingProvider


class LocalHashEmbeddingProvider(EmbeddingProvider):
    def __init__(self, *, dimension: int) -> None:
        self._dimension = dimension

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def provider_name(self) -> str:
        return "local_hash"

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    def _embed(self, text: str) -> list[float]:
        values = [0.0 for _ in range(self.dimension)]
        tokens = text.lower().split()

        if not tokens:
            return values

        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            for index in range(self.dimension):
                byte = digest[index % len(digest)]
                values[index] += (byte / 255.0) - 0.5

        norm = sum(value * value for value in values) ** 0.5
        if norm == 0:
            return values
        return [value / norm for value in values]

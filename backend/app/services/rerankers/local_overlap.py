import re
from collections import Counter

from app.services.rerankers.base import Reranker


TOKEN_PATTERN = re.compile(r"[a-zA-Z0-9]+")


class LocalOverlapReranker(Reranker):
    @property
    def provider_name(self) -> str:
        return "local_overlap"

    def rerank(self, query: str, passages: list[str]) -> list[float]:
        query_tokens = self._tokenize(query)
        query_counter = Counter(query_tokens)

        scores: list[float] = []
        for passage in passages:
            passage_tokens = self._tokenize(passage)
            passage_counter = Counter(passage_tokens)
            overlap = sum(min(query_counter[token], passage_counter[token]) for token in query_counter)
            normalization = max(len(query_tokens), 1)
            scores.append(overlap / normalization)
        return scores

    def _tokenize(self, text: str) -> list[str]:
        return [token.lower() for token in TOKEN_PATTERN.findall(text)]

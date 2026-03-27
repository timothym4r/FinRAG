from abc import ABC, abstractmethod


class Reranker(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        raise NotImplementedError

    @abstractmethod
    def rerank(self, query: str, passages: list[str]) -> list[float]:
        raise NotImplementedError

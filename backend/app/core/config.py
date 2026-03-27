from functools import lru_cache
from pathlib import Path

from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="FINRAG_",
        case_sensitive=False,
    )

    env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    database_url: str = "sqlite:///./data/finrag.db"
    upload_dir: str = "./data/uploads"
    cors_origins: str = "http://localhost:3000"
    chunk_size: int = 1200
    chunk_overlap: int = 200
    embedding_provider: str = "local_hash"
    embedding_dimension: int = 256
    embedding_batch_size: int = 32
    embedding_max_retries: int = 3
    qdrant_collection: str = "finrag_chunks"
    qdrant_local_path: str = "./data/qdrant"
    qdrant_url: str = ""
    qdrant_api_key: str = ""
    vector_distance: str = "cosine"
    retrieval_top_k: int = 8
    rerank_top_n: int = 5
    rerank_provider: str = "local_overlap"
    retrieval_min_score: float = 0.15

    @field_validator(
        "api_port",
        "chunk_size",
        "chunk_overlap",
        "embedding_dimension",
        "embedding_batch_size",
        "embedding_max_retries",
        "retrieval_top_k",
        "rerank_top_n",
    )
    @classmethod
    def validate_positive_numbers(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("must be greater than zero")
        return value

    @field_validator("retrieval_min_score")
    @classmethod
    def validate_retrieval_threshold(cls, value: float) -> float:
        if value < 0 or value > 1:
            raise ValueError("must be between 0 and 1")
        return value

    @field_validator("vector_distance")
    @classmethod
    def validate_vector_distance(cls, value: str) -> str:
        allowed = {"cosine", "dot", "euclid"}
        normalized = value.lower().strip()
        if normalized not in allowed:
            raise ValueError(f"must be one of {sorted(allowed)}")
        return normalized

    @computed_field
    @property
    def resolved_upload_dir(self) -> Path:
        return Path(self.upload_dir).resolve()

    @computed_field
    @property
    def resolved_qdrant_local_path(self) -> Path:
        return Path(self.qdrant_local_path).resolve()

    @computed_field
    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

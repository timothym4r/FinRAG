from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.api.deps import get_db, get_storage_service
from app.core.config import Settings, get_settings
from app.core.database import Base
from app.main import create_app
from app.models.chunk import DocumentChunk  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.services.storage import LocalFileStorage


@pytest.fixture
def test_settings(tmp_path: Path) -> Settings:
    data_dir = tmp_path / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    return Settings(
        env="test",
        database_url=f"sqlite:///{data_dir / 'test.db'}",
        upload_dir=str(data_dir / "uploads"),
        qdrant_local_path=str(data_dir / "qdrant"),
        cors_origins="http://localhost:3000",
    )


@pytest.fixture
def client(test_settings: Settings) -> Generator[TestClient, None, None]:
    engine = create_engine(
        test_settings.database_url,
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    app = create_app(test_settings)
    app.state.db_engine = engine
    app.state.session_factory = TestingSessionLocal

    def override_settings() -> Settings:
        return test_settings

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    def override_storage() -> LocalFileStorage:
        return LocalFileStorage(base_dir=test_settings.resolved_upload_dir)

    app.dependency_overrides[get_settings] = override_settings
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_storage_service] = override_storage

    with TestClient(app) as test_client:
        yield test_client

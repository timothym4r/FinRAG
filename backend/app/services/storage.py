import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.errors import FileStorageError, InvalidUploadError


class StorageService(ABC):
    @abstractmethod
    def save(self, file: UploadFile) -> str:
        raise NotImplementedError

    @abstractmethod
    def delete(self, storage_path: str) -> None:
        raise NotImplementedError


class LocalFileStorage(StorageService):
    def __init__(self, *, base_dir: Path) -> None:
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, file: UploadFile) -> str:
        if not file.filename:
            raise InvalidUploadError("Uploaded file must include a filename.")

        destination = self.base_dir / f"{uuid4()}-{Path(file.filename).name}"
        try:
            with destination.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except OSError as exc:
            raise FileStorageError("Failed to persist uploaded file.") from exc
        finally:
            file.file.close()
        return str(destination)

    def delete(self, storage_path: str) -> None:
        path = Path(storage_path)
        if path.exists():
            try:
                path.unlink()
            except OSError as exc:
                raise FileStorageError("Failed to delete stored file.") from exc


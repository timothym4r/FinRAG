from datetime import date
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, File, Form, Request, Response, UploadFile, status

from app.api.routes.shared import DocumentServiceDep, SettingsDep
from app.models.document import FilingType, DocumentStatus
from app.schemas.document import DocumentDetailResponse, DocumentListResponse, DocumentSummaryResponse
from app.services.background import process_document_ingestion, process_document_reindex

router = APIRouter()


@router.post(
    "/upload",
    response_model=DocumentSummaryResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    settings: SettingsDep,
    document_service: DocumentServiceDep,
    file: UploadFile = File(...),
    company: str = Form(...),
    filing_type: FilingType = Form(...),
    filing_date: date = Form(...),
) -> DocumentDetailResponse:
    document = document_service.create_document(
        file=file,
        company=company,
        filing_type=filing_type,
        filing_date=filing_date,
        initial_status=DocumentStatus.UPLOADED,
    )
    background_tasks.add_task(
        process_document_ingestion,
        document.id,
        request.app.state.session_factory,
        settings,
    )
    return DocumentSummaryResponse.model_validate(document)


@router.get("", response_model=DocumentListResponse)
def list_documents(document_service: DocumentServiceDep) -> DocumentListResponse:
    documents = document_service.list_documents()
    return DocumentListResponse(items=[DocumentSummaryResponse.model_validate(doc) for doc in documents])


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: UUID,
    document_service: DocumentServiceDep,
) -> DocumentDetailResponse:
    document = document_service.get_document(document_id)
    return DocumentDetailResponse.model_validate(document)


@router.post("/{document_id}/reindex", response_model=DocumentSummaryResponse, status_code=status.HTTP_202_ACCEPTED)
def reindex_document(
    document_id: UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    settings: SettingsDep,
    document_service: DocumentServiceDep,
) -> DocumentSummaryResponse:
    document = document_service.get_document(document_id)
    background_tasks.add_task(
        process_document_reindex,
        document.id,
        request.app.state.session_factory,
        settings,
    )
    return DocumentSummaryResponse.model_validate(document)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    document_service: DocumentServiceDep,
) -> Response:
    document_service.delete_document(document_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

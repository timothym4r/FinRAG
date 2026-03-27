from fastapi import APIRouter

from app.api.routes.shared import RetrievalQAServiceDep
from app.schemas.qa import QAQueryRequest, QAResponse

router = APIRouter()


@router.post("/query", response_model=QAResponse)
def query_documents(
    payload: QAQueryRequest,
    qa_service: RetrievalQAServiceDep,
) -> QAResponse:
    return qa_service.answer_query(
        query=payload.query,
        top_k=payload.top_k,
        document_id=payload.document_id,
        company=payload.company,
    )

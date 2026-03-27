from io import BytesIO

from reportlab.pdfgen import canvas


def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["database"] == "connected"


def test_upload_list_get_delete_document(client):
    upload_response = client.post(
        "/documents/upload",
        files={
            "file": (
                "nvidia-10k.txt",
                BytesIO(
                    b"Item 1A. Risk Factors\nDemand concentration may increase volatility.\nManagement's Discussion and Analysis\nRevenue increased due to data center demand."
                ),
                "text/plain",
            )
        },
        data={
            "company": "NVIDIA",
            "filing_type": "10-K",
            "filing_date": "2025-02-21",
        },
    )

    assert upload_response.status_code == 201
    uploaded = upload_response.json()
    document_id = uploaded["id"]
    assert uploaded["status"] == "uploaded"
    assert uploaded["company"] == "NVIDIA"

    list_response = client.get("/documents")
    assert list_response.status_code == 200
    items = list_response.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == document_id
    assert items[0]["status"] == "indexed"
    assert items[0]["chunk_count"] >= 1

    detail_response = client.get(f"/documents/{document_id}")
    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert detail_payload["filename"] == "nvidia-10k.txt"
    assert detail_payload["status"] == "indexed"
    assert detail_payload["chunk_count"] >= 1
    assert any(chunk["section"] == "Risk Factors" for chunk in detail_payload["chunks"])
    assert any(chunk["section"] == "MD&A" for chunk in detail_payload["chunks"])

    delete_response = client.delete(f"/documents/{document_id}")
    assert delete_response.status_code == 204

    missing_response = client.get(f"/documents/{document_id}")
    assert missing_response.status_code == 404


def test_pdf_upload_extracts_text_and_sections(client):
    pdf_buffer = BytesIO()
    pdf = canvas.Canvas(pdf_buffer)
    pdf.drawString(72, 750, "Item 1A. Risk Factors")
    pdf.drawString(72, 732, "Supply chain concentration and export controls could affect demand.")
    pdf.showPage()
    pdf.drawString(72, 750, "Management's Discussion and Analysis")
    pdf.drawString(72, 732, "Operating margin expanded as data center revenue scaled.")
    pdf.save()
    pdf_buffer.seek(0)

    upload_response = client.post(
        "/documents/upload",
        files={"file": ("microsoft-q.pdf", pdf_buffer, "application/pdf")},
        data={
            "company": "Microsoft",
            "filing_type": "10-Q",
            "filing_date": "2025-01-29",
        },
    )

    assert upload_response.status_code == 201
    document_id = upload_response.json()["id"]

    detail_response = client.get(f"/documents/{document_id}")
    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert detail_payload["status"] == "indexed"
    assert detail_payload["chunk_count"] >= 2
    assert {chunk["section"] for chunk in detail_payload["chunks"]} >= {"Risk Factors", "MD&A"}


def test_reindex_document(client):
    upload_response = client.post(
        "/documents/upload",
        files={
            "file": (
                "palantir-10q.txt",
                BytesIO(
                    b"Risk Factors\nGovernment concentration could affect revenue volatility.\n"
                ),
                "text/plain",
            )
        },
        data={
            "company": "Palantir",
            "filing_type": "10-Q",
            "filing_date": "2025-11-05",
        },
    )

    assert upload_response.status_code == 201
    document_id = upload_response.json()["id"]

    reindex_response = client.post(f"/documents/{document_id}/reindex")
    assert reindex_response.status_code == 202
    assert reindex_response.json()["id"] == document_id

    detail_response = client.get(f"/documents/{document_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["status"] == "indexed"


def test_qa_query_returns_grounded_answer_and_citations(client):
    upload_response = client.post(
        "/documents/upload",
        files={
            "file": (
                "nvidia-qa.txt",
                BytesIO(
                    b"Item 1A. Risk Factors\nCustomer concentration may increase quarterly volatility if a small number of hyperscale buyers reduce demand.\n"
                    b"Management's Discussion and Analysis\nRevenue growth was driven by data center demand and networking platform adoption."
                ),
                "text/plain",
            )
        },
        data={
            "company": "NVIDIA",
            "filing_type": "10-K",
            "filing_date": "2025-02-21",
        },
    )

    assert upload_response.status_code == 201

    qa_response = client.post(
        "/qa/query",
        json={
            "query": "Why does the filing discuss customer concentration risk?",
            "top_k": 3,
            "company": "NVIDIA",
        },
    )

    assert qa_response.status_code == 200
    payload = qa_response.json()
    assert payload["citations"]
    assert payload["retrieved_chunks"]
    assert payload["confidence"] > 0
    assert "customer concentration" in payload["answer"].lower()
    cited_ids = set(payload["citations"])
    retrieved_ids = {chunk["chunk_id"] for chunk in payload["retrieved_chunks"]}
    assert cited_ids.issubset(retrieved_ids)


def test_qa_query_declines_when_evidence_is_weak(client):
    qa_response = client.post(
        "/qa/query",
        json={
            "query": "What was the CEO's favorite vacation destination?",
            "top_k": 3,
        },
    )

    assert qa_response.status_code == 200
    payload = qa_response.json()
    assert payload["citations"] == []
    assert "could not answer" in payload["answer"].lower() or "too weak" in payload["answer"].lower()

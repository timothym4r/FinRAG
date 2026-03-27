from io import BytesIO


def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["database"] == "connected"


def test_upload_list_get_delete_document(client):
    upload_response = client.post(
        "/documents/upload",
        files={"file": ("nvidia-10k.txt", BytesIO(b"risk factors content"), "text/plain")},
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

    detail_response = client.get(f"/documents/{document_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["filename"] == "nvidia-10k.txt"

    delete_response = client.delete(f"/documents/{document_id}")
    assert delete_response.status_code == 204

    missing_response = client.get(f"/documents/{document_id}")
    assert missing_response.status_code == 404


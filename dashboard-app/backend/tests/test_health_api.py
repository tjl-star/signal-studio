from fastapi.testclient import TestClient

from app.main import create_app


def test_health_reports_local_sqlite_runtime(tmp_path):
    app = create_app(database_url=f"sqlite:///{tmp_path / 'signal-studio.db'}")

    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "application": "Signal Studio",
        "storage": "sqlite",
    }

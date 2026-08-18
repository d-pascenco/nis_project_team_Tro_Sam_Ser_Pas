import os
from datetime import datetime, timezone

os.environ.setdefault("DATABASE_URL", "postgresql://nextpath_app:test@127.0.0.1:5432/nextpath")
os.environ.setdefault("CREATE_TABLES_ON_STARTUP", "false")

from fastapi.testclient import TestClient

from app.main import app
from app.database import get_db


class FakeDb:
    def add(self, obj):
        self.obj = obj

    def commit(self):
        pass

    def refresh(self, obj):
        obj.id = 42
        obj.created_at = datetime(2026, 5, 6, tzinfo=timezone.utc)

    def rollback(self):
        pass

    def execute(self, _statement):
        return None


def override_db():
    yield FakeDb()


def test_health() -> None:
    app.dependency_overrides[get_db] = override_db
    client = TestClient(app)
    response = client.get("/api/health")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["db"] == "ok"


def test_submit_onboarding_form_with_frontend_camel_case_payload() -> None:
    app.dependency_overrides[get_db] = override_db
    client = TestClient(app)

    response = client.post(
        "/api/forms",
        json={
            "fullName": "Anna Ivanova",
            "age": "21",
            "location": "Moscow",
            "currentStatus": "student",
            "education": "bachelor",
            "university": "HSE",
            "specialization": "Computer Science",
            "yearsExperience": "1",
            "currentRole": "Intern",
            "cvSummary": "Python and SQL basics",
            "targetProfession": "Data Scientist",
            "targetIndustry": "AI / ML",
            "timeline": "6 months",
            "motivation": "Want a first analytics job",
            "priorities": ["growth", "remote"],
            "technicalSkills": ["Python", "SQL"],
            "softSkills": ["Коммуникация"],
            "languages": [{"name": "English", "level": 70}],
            "learningStyle": "projects",
            "hoursPerWeek": 15,
            "budget": "free",
            "healthConsiderations": "No",
            "preferOnline": True,
            "preferRussian": True,
            "needMentorship": False,
            "additionalInfo": "Prefers evening study",
        },
    )
    app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["id"] == 42
    assert response.json()["message"] == "Form data saved successfully."


def test_submit_onboarding_form_validates_ranges() -> None:
    client = TestClient(app)
    response = client.post("/api/forms", json={"fullName": "Bo", "hoursPerWeek": 120})

    assert response.status_code == 422

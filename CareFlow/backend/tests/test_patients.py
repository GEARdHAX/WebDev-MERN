from datetime import date, timedelta

import pytest

API = "/api/patients"


def new_patient(**changes):
    patient = {
        "name": "Rahul Sharma",
        "age": 45,
        "gender": "Male",
        "ward": "General",
        "department": "Cardiology",
        "doctor": "Dr. Mehta",
        "admission_date": date.today().isoformat(),
        "status": "Admitted",
    }
    patient.update(changes)
    return patient


def create(client, **changes):
    response = client.post(API, json=new_patient(**changes))
    assert response.status_code == 201
    return response.json()


def test_create_patient_returns_201_with_saved_record(client):
    response = client.post(API, json=new_patient())

    assert response.status_code == 201
    body = response.json()
    assert body["id"] is not None
    assert body["name"] == "Rahul Sharma"
    assert body["status"] == "Admitted"
    assert "created_at" in body and "updated_at" in body


def test_create_rejects_missing_required_fields(client):
    response = client.post(API, json={"name": "Rahul Sharma"})

    assert response.status_code == 422
    missing = {error["loc"][-1] for error in response.json()["detail"]}
    assert {"age", "gender", "ward", "department", "doctor", "admission_date"} <= missing


@pytest.mark.parametrize("name", ["Rahul123", "Rahul-Sharma", "   "])
def test_create_rejects_invalid_name(client, name):
    response = client.post(API, json=new_patient(name=name))

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "name"


@pytest.mark.parametrize("age", [-1, 121, 45.5])
def test_create_rejects_invalid_age(client, age):
    response = client.post(API, json=new_patient(age=age))

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "age"


@pytest.mark.parametrize(
    "field, value",
    [
        ("gender", "Unknown"),
        ("ward", "Basement"),
        ("department", "Dermatology"),
        ("doctor", "Dr. Smith"),
    ],
)
def test_create_rejects_values_outside_allowed_options(client, field, value):
    response = client.post(API, json=new_patient(**{field: value}))

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == field


def test_create_rejects_future_admission_date(client):
    tomorrow = (date.today() + timedelta(days=1)).isoformat()

    response = client.post(API, json=new_patient(admission_date=tomorrow))

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "admission_date"


def test_get_patient_by_id(client):
    created = create(client)

    response = client.get(f"{API}/{created['id']}")

    assert response.status_code == 200
    assert response.json()["name"] == "Rahul Sharma"


def test_get_nonexistent_patient_returns_404(client):
    assert client.get(f"{API}/9999").status_code == 404


def test_search_matches_partial_name_case_insensitively(client):
    create(client, name="Rahul Sharma")
    create(client, name="Anita Rao")

    response = client.get(API, params={"search": "SHAR"})

    assert [patient["name"] for patient in response.json()] == ["Rahul Sharma"]


def test_each_filter_and_combined_filters_apply_together(client):
    create(client, name="Rahul Sharma", ward="ICU", department="Cardiology", doctor="Dr. Mehta")
    create(client, name="Rahul Verma", ward="General", department="Cardiology", doctor="Dr. Rao")
    create(client, name="Anita Rao", ward="ICU", department="Neurology", doctor="Dr. Mehta")

    by_ward = client.get(API, params={"ward": "ICU"}).json()
    by_department = client.get(API, params={"department": "Cardiology"}).json()
    by_doctor = client.get(API, params={"doctor": "Dr. Mehta"}).json()
    combined = client.get(
        API,
        params={"search": "rahul", "ward": "ICU", "department": "Cardiology", "doctor": "Dr. Mehta"},
    ).json()

    assert len(by_ward) == 2
    assert len(by_department) == 2
    assert len(by_doctor) == 2
    assert [patient["name"] for patient in combined] == ["Rahul Sharma"]


def test_update_patient_saves_changes(client):
    created = create(client)

    response = client.put(f"{API}/{created['id']}", json={"ward": "ICU", "age": 46})

    assert response.status_code == 200
    assert response.json()["ward"] == "ICU"
    assert response.json()["age"] == 46


@pytest.mark.parametrize(
    "payload, status_code",
    [
        ({}, 400),
        ({"name": None}, 422),
        ({"age": 200}, 422),
        ({"gender": "Unknown"}, 422),
    ],
)
def test_update_rejects_empty_null_and_invalid_values(client, payload, status_code):
    created = create(client)

    response = client.put(f"{API}/{created['id']}", json=payload)

    assert response.status_code == status_code


def test_delete_patient_removes_record(client):
    created = create(client)

    assert client.delete(f"{API}/{created['id']}").status_code == 204
    assert client.get(f"{API}/{created['id']}").status_code == 404


def test_discharge_patient_then_reject_repeated_discharge(client):
    created = create(client)

    first = client.patch(f"{API}/{created['id']}/discharge")
    second = client.patch(f"{API}/{created['id']}/discharge")

    assert first.status_code == 200
    assert first.json()["status"] == "Discharged"
    assert second.status_code == 409


@pytest.mark.parametrize(
    "method, path",
    [
        ("get", "/9999"),
        ("put", "/9999"),
        ("delete", "/9999"),
        ("patch", "/9999/discharge"),
    ],
)
def test_nonexistent_patient_returns_404(client, method, path):
    kwargs = {"json": {"ward": "ICU"}} if method == "put" else {}

    response = getattr(client, method)(f"{API}{path}", **kwargs)

    assert response.status_code == 404


def test_stats_are_calculated_from_all_records(client):
    create(client, status="Admitted")
    create(client, status="Admitted", admission_date=(date.today() - timedelta(days=3)).isoformat())
    discharged = create(client, status="Admitted")
    client.patch(f"{API}/{discharged['id']}/discharge")

    response = client.get(f"{API}/stats")

    assert response.json() == {
        "total": 3,
        "admitted": 2,
        "discharged": 1,
        "today_admissions": 2,
    }

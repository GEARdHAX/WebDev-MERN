from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from app.schemas import PatientCreate

valid_patient = {
    "name": "Rahul Sharma",
    "age": 45,
    "gender": "Male",
    "ward": "General",
    "department": "Cardiology",
    "doctor": "Dr. Mehta",
    "admission_date": date.today(),
    "status": "Admitted",
}


def test_valid_patient():
    patient = PatientCreate(**valid_patient)
    assert patient.name == "Rahul Sharma"


def test_invalid_age():
    data = {**valid_patient, "age": 150}

    with pytest.raises(ValidationError):
        PatientCreate(**data)


def test_invalid_name():
    data = {**valid_patient, "name": "Rahul123"}

    with pytest.raises(ValidationError):
        PatientCreate(**data)


def test_future_admission_date():
    data = {**valid_patient, "admission_date": date.today() + timedelta(days=1)}

    with pytest.raises(ValidationError):
        PatientCreate(**data)


def test_invalid_gender():
    data = {**valid_patient, "gender": "Unknown"}

    with pytest.raises(ValidationError):
        PatientCreate(**data)

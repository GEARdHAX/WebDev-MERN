import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

Gender = Literal["Male", "Female", "Other"]
Ward = Literal["General", "ICU", "Private", "Emergency"]
Department = Literal[
    "Cardiology", "Neurology", "Orthopedics", "General Medicine", "Pediatrics"
]
Doctor = Literal["Dr. Mehta", "Dr. Rao", "Dr. Sharma", "Dr. Das"]
Status = Literal["Admitted", "Discharged"]


def check_name(value):
    if value is None:
        return None

    value = value.strip()

    if value == "":
        raise ValueError("Name is required.")

    if len(value) > 120:
        raise ValueError("Name must be 120 characters or fewer.")

    if not re.fullmatch(r"[A-Za-z ]+", value):
        raise ValueError("Name can contain only letters and spaces.")

    return value


def check_admission_date(value):
    if value is not None and value > date.today():
        raise ValueError("Admission date cannot be in the future.")

    return value


class PatientCreate(BaseModel):
    name: str
    age: int = Field(ge=0, le=120, strict=True)
    gender: Gender
    ward: Ward
    department: Department
    doctor: Doctor
    admission_date: date
    status: Status = "Admitted"

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        return check_name(value)

    @field_validator("admission_date")
    @classmethod
    def validate_admission_date(cls, value):
        return check_admission_date(value)


class PatientUpdate(BaseModel):
    name: str | None = None
    age: int | None = Field(default=None, ge=0, le=120, strict=True)
    gender: Gender | None = None
    ward: Ward | None = None
    department: Department | None = None
    doctor: Doctor | None = None
    admission_date: date | None = None
    status: Status | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        return check_name(value)

    @field_validator("admission_date")
    @classmethod
    def validate_admission_date(cls, value):
        return check_admission_date(value)


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    age: int
    gender: Gender
    ward: Ward
    department: Department
    doctor: Doctor
    admission_date: date
    status: Status
    created_at: datetime
    updated_at: datetime


class PatientStats(BaseModel):
    total: int
    admitted: int
    discharged: int
    today_admissions: int

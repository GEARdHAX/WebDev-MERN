from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Patient
from app.schemas import (
    Department,
    Doctor,
    PatientCreate,
    PatientResponse,
    PatientStats,
    PatientUpdate,
    Ward,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


def get_patient_or_404(db: Session, patient_id: int) -> Patient:
    patient = db.get(Patient, patient_id)

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found.")

    return patient


@router.post("", response_model=PatientResponse, status_code=201)
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    patient = Patient(**data.model_dump())

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return patient


@router.get("", response_model=list[PatientResponse])
def list_patients(
    search: str | None = Query(default=None, max_length=120),
    ward: Ward | None = None,
    department: Department | None = None,
    doctor: Doctor | None = None,
    db: Session = Depends(get_db),
):
    query = select(Patient)

    if search:
        query = query.where(Patient.name.ilike(f"%{search}%"))

    if ward:
        query = query.where(Patient.ward == ward)

    if department:
        query = query.where(Patient.department == department)

    if doctor:
        query = query.where(Patient.doctor == doctor)

    query = query.order_by(Patient.created_at.desc(), Patient.id.desc())

    return db.scalars(query).all()


@router.get("/stats", response_model=PatientStats)
def get_patient_stats(db: Session = Depends(get_db)):
    total = db.scalar(select(func.count(Patient.id)))
    admitted = db.scalar(
        select(func.count(Patient.id)).where(Patient.status == "Admitted")
    )
    discharged = db.scalar(
        select(func.count(Patient.id)).where(Patient.status == "Discharged")
    )
    today_admissions = db.scalar(
        select(func.count(Patient.id)).where(Patient.admission_date == date.today())
    )

    return {
        "total": total,
        "admitted": admitted,
        "discharged": discharged,
        "today_admissions": today_admissions,
    }


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    return get_patient_or_404(db, patient_id)


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int, data: PatientUpdate, db: Session = Depends(get_db)
):
    patient = get_patient_or_404(db, patient_id)

    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400, detail="At least one field must be provided."
        )

    null_fields = [field for field, value in updates.items() if value is None]

    if null_fields:
        raise HTTPException(
            status_code=422,
            detail=f"These fields cannot be empty: {', '.join(null_fields)}.",
        )

    for field, value in updates.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = get_patient_or_404(db, patient_id)

    db.delete(patient)
    db.commit()

    return Response(status_code=204)


@router.patch("/{patient_id}/discharge", response_model=PatientResponse)
def discharge_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = get_patient_or_404(db, patient_id)

    if patient.status == "Discharged":
        raise HTTPException(status_code=409, detail="Patient is already discharged.")

    patient.status = "Discharged"

    db.commit()
    db.refresh(patient)

    return patient

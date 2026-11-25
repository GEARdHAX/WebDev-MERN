import { useState } from 'react'

import { getErrorMessage } from '../services/patientApi'
import { DEPARTMENTS, DOCTORS, GENDERS, NAME_MAX_LENGTH, STATUSES, WARDS } from '../utils/constants'
import { todayIsoDate, validatePatient } from '../utils/validation'

const emptyForm = {
  name: '',
  age: '',
  gender: '',
  ward: '',
  department: '',
  doctor: '',
  admission_date: '',
  status: 'Admitted',
}

const selectFields = [
  { name: 'gender', label: 'Gender', options: GENDERS },
  { name: 'ward', label: 'Ward', options: WARDS },
  { name: 'department', label: 'Department', options: DEPARTMENTS },
  { name: 'doctor', label: 'Doctor', options: DOCTORS },
  { name: 'status', label: 'Status', options: STATUSES },
]

function PatientForm({ patient, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    patient
      ? { ...patient, age: String(patient.age) }
      : emptyForm
  )
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (saving) return

    const validationErrors = validatePatient(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    setSaving(true)
    setFormError('')

    const payload = {
      name: form.name.trim(),
      age: Number(form.age),
      gender: form.gender,
      ward: form.ward,
      department: form.department,
      doctor: form.doctor,
      admission_date: form.admission_date,
      status: form.status,
    }

    try {
      await onSubmit(payload)
    } catch (requestError) {
      setFormError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  function errorId(name) {
    return `patient-${name}-error`
  }

  return (
    <form className="patient-form" onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert" role="alert">{formError}</div>}

      <div className="form-grid">
        <div className="form-field form-field--wide">
          <label className="field-label" htmlFor="patient-name">Full name</label>
          <input
            id="patient-name"
            name="name"
            className="field-input"
            maxLength={NAME_MAX_LENGTH}
            value={form.name}
            onChange={handleChange}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? errorId('name') : undefined}
            autoFocus
          />
          {errors.name && <p className="field-error" id={errorId('name')}>{errors.name}</p>}
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="patient-age">Age</label>
          <input
            id="patient-age"
            name="age"
            inputMode="numeric"
            className="field-input"
            value={form.age}
            onChange={handleChange}
            aria-invalid={Boolean(errors.age)}
            aria-describedby={errors.age ? errorId('age') : undefined}
          />
          {errors.age && <p className="field-error" id={errorId('age')}>{errors.age}</p>}
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="patient-admission_date">Admission date</label>
          <input
            id="patient-admission_date"
            name="admission_date"
            type="date"
            max={todayIsoDate()}
            className="field-input"
            value={form.admission_date}
            onChange={handleChange}
            aria-invalid={Boolean(errors.admission_date)}
            aria-describedby={errors.admission_date ? errorId('admission_date') : undefined}
          />
          {errors.admission_date && (
            <p className="field-error" id={errorId('admission_date')}>{errors.admission_date}</p>
          )}
        </div>

        {selectFields.map((field) => (
          <div className="form-field" key={field.name}>
            <label className="field-label" htmlFor={`patient-${field.name}`}>{field.label}</label>
            <select
              id={`patient-${field.name}`}
              name={field.name}
              className="field-input"
              value={form[field.name]}
              onChange={handleChange}
              aria-invalid={Boolean(errors[field.name])}
              aria-describedby={errors[field.name] ? errorId(field.name) : undefined}
            >
              <option value="">Select</option>
              {field.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors[field.name] && (
              <p className="field-error" id={errorId(field.name)}>{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="modal-actions">
        <button type="button" className="button button--outline" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="button" disabled={saving}>
          {saving ? 'Saving...' : patient ? 'Save changes' : 'Add patient'}
        </button>
      </div>
    </form>
  )
}

export default PatientForm

import {
  AGE_MAX,
  AGE_MIN,
  DEPARTMENTS,
  DOCTORS,
  GENDERS,
  NAME_MAX_LENGTH,
  STATUSES,
  WARDS,
} from './constants'

const NAME_PATTERN = /^[A-Za-z ]+$/
const WHOLE_NUMBER_PATTERN = /^\d+$/

export function todayIsoDate() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

function validateName(name) {
  const trimmedName = name.trim()

  if (!trimmedName) return 'Name is required.'
  if (trimmedName.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`
  if (!NAME_PATTERN.test(trimmedName)) return 'Name can contain only letters and spaces.'

  return ''
}

function validateAge(age) {
  const trimmedAge = String(age).trim()

  if (!trimmedAge) return 'Age is required.'
  if (!WHOLE_NUMBER_PATTERN.test(trimmedAge) || Number(trimmedAge) > AGE_MAX) {
    return `Age must be a whole number between ${AGE_MIN} and ${AGE_MAX}.`
  }

  return ''
}

function validateAdmissionDate(admissionDate) {
  if (!admissionDate) return 'Admission date is required.'
  if (admissionDate > todayIsoDate()) return 'Admission date cannot be in the future.'

  return ''
}

function validateOption(value, allowedOptions, message) {
  return allowedOptions.includes(value) ? '' : message
}

export function validatePatient(form) {
  const errors = {
    name: validateName(form.name),
    age: validateAge(form.age),
    gender: validateOption(form.gender, GENDERS, 'Select a gender.'),
    ward: validateOption(form.ward, WARDS, 'Select a ward.'),
    department: validateOption(form.department, DEPARTMENTS, 'Select a department.'),
    doctor: validateOption(form.doctor, DOCTORS, 'Select a doctor.'),
    admission_date: validateAdmissionDate(form.admission_date),
    status: validateOption(form.status, STATUSES, 'Select a status.'),
  }

  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

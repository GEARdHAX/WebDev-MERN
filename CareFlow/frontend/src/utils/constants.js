export const GENDERS = ['Male', 'Female', 'Other']
export const WARDS = ['General', 'ICU', 'Private', 'Emergency']
export const DEPARTMENTS = ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine', 'Pediatrics']
export const DOCTORS = ['Dr. Mehta', 'Dr. Rao', 'Dr. Sharma', 'Dr. Das']
export const STATUSES = ['Admitted', 'Discharged']

export const AGE_MIN = 0
export const AGE_MAX = 120
export const NAME_MAX_LENGTH = 120

export const REQUEST_TIMEOUT_MS = 10000
export const SEARCH_DEBOUNCE_MS = 300
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const FIELD_LABELS = {
  name: 'Name',
  age: 'Age',
  gender: 'Gender',
  ward: 'Ward',
  department: 'Department',
  doctor: 'Doctor',
  admission_date: 'Admission date',
  status: 'Status',
}

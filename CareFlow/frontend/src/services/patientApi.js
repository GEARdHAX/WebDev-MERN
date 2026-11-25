import axios from 'axios'

import { API_URL, FIELD_LABELS, REQUEST_TIMEOUT_MS } from '../utils/constants'

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
})

function formatValidationIssue(issue) {
  const field = issue.loc?.[issue.loc.length - 1]
  const message = issue.msg.replace(/^Value error, /, '')

  return FIELD_LABELS[field] ? `${FIELD_LABELS[field]}: ${message}` : message
}

export function getErrorMessage(error) {
  if (error.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again.'
  }

  if (!error.response) {
    return 'Cannot reach the server. Check your connection and try again.'
  }

  const { status, data } = error.response

  if (status === 422 && Array.isArray(data?.detail)) {
    return data.detail.map(formatValidationIssue).join(' ')
  }

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  if (status >= 500) {
    return 'Something went wrong on the server. Please try again.'
  }

  return 'The request could not be completed.'
}

function buildPatientParams({ search, ward, department, doctor }) {
  const params = {}

  if (search.trim()) params.search = search.trim()
  if (ward) params.ward = ward
  if (department) params.department = department
  if (doctor) params.doctor = doctor

  return params
}

export async function fetchPatients(filters) {
  const response = await apiClient.get('/patients', { params: buildPatientParams(filters) })
  return response.data
}

export async function fetchPatientStats() {
  const response = await apiClient.get('/patients/stats')
  return response.data
}

export async function createPatient(patient) {
  const response = await apiClient.post('/patients', patient)
  return response.data
}

export async function updatePatient(id, patient) {
  const response = await apiClient.put(`/patients/${id}`, patient)
  return response.data
}

export async function deletePatient(id) {
  await apiClient.delete(`/patients/${id}`)
}

export async function dischargePatient(id) {
  const response = await apiClient.patch(`/patients/${id}/discharge`)
  return response.data
}

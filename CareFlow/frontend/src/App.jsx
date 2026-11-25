import { useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Plus } from 'lucide-react'

import Modal from './components/Modal'
import PatientFilters from './components/PatientFilters'
import PatientForm from './components/PatientForm'
import PatientStats from './components/PatientStats'
import PatientTable from './components/PatientTable'
import {
  createPatient,
  deletePatient,
  dischargePatient,
  fetchPatientStats,
  fetchPatients,
  getErrorMessage,
  updatePatient,
} from './services/patientApi'
import { SEARCH_DEBOUNCE_MS } from './utils/constants'

const emptyFilters = { search: '', ward: '', department: '', doctor: '' }

function App() {
  const [filters, setFilters] = useState(emptyFilters)
  const [patients, setPatients] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [patientToDelete, setPatientToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { search, ward, department, doctor } = filters
  const hasActiveFilters = Boolean(search || ward || department || doctor)

  useEffect(() => {
    let isLatest = true

    const timer = setTimeout(async () => {
      setLoading(true)

      try {
        const [patientList, patientStats] = await Promise.all([
          fetchPatients({ search, ward, department, doctor }),
          fetchPatientStats(),
        ])

        if (isLatest) {
          setPatients(patientList)
          setStats(patientStats)
          setError('')
        }
      } catch (requestError) {
        if (isLatest) setError(getErrorMessage(requestError))
      } finally {
        if (isLatest) setLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      isLatest = false
      clearTimeout(timer)
    }
  }, [search, ward, department, doctor, refreshCount])

  function reload() {
    setRefreshCount((count) => count + 1)
  }

  function changeFilter(name, value) {
    setFilters({ ...filters, [name]: value })
  }

  function openNewForm() {
    setEditingPatient(null)
    setFormOpen(true)
  }

  function openEditForm(patient) {
    setEditingPatient(patient)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
  }

  async function savePatient(patientData) {
    if (editingPatient) {
      await updatePatient(editingPatient.id, patientData)
      toast.success('Patient updated.')
    } else {
      await createPatient(patientData)
      toast.success('Patient added.')
    }

    setFormOpen(false)
    reload()
  }

  async function discharge(patient) {
    try {
      await dischargePatient(patient.id)
      toast.success(`${patient.name} has been discharged.`)
      reload()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    }
  }

  async function confirmDelete() {
    setDeleting(true)

    try {
      await deletePatient(patientToDelete.id)
      toast.success('Patient deleted.')
      setPatientToDelete(null)
      reload()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="container app-header__inner">
          <div>
            <p className="eyebrow">Patient Admission Management</p>
            <h1>CareFlow</h1>
          </div>
          <button type="button" className="button" onClick={openNewForm}>
            <Plus size={16} aria-hidden="true" />
            Add patient
          </button>
        </div>
      </header>

      <main className="container">
        <section className="section">
          <PatientStats stats={stats} />
        </section>

        <section className="section">
          <PatientFilters
            filters={filters}
            onChange={changeFilter}
            onClear={() => setFilters(emptyFilters)}
            hasActiveFilters={hasActiveFilters}
          />
        </section>

        <section className="section">
          {error ? (
            <div className="alert" role="alert">
              <p>{error}</p>
              <button type="button" className="button button--outline" onClick={reload}>
                Retry
              </button>
            </div>
          ) : (
            <PatientTable
              patients={patients}
              loading={loading}
              hasActiveFilters={hasActiveFilters}
              onEdit={openEditForm}
              onDischarge={discharge}
              onDelete={setPatientToDelete}
            />
          )}
        </section>
      </main>

      {formOpen && (
        <Modal title={editingPatient ? 'Edit patient' : 'Add patient'} onClose={closeForm}>
          <PatientForm
            key={editingPatient?.id ?? 'new'}
            patient={editingPatient}
            onSubmit={savePatient}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {patientToDelete && (
        <Modal title="Delete patient" onClose={() => setPatientToDelete(null)}>
          <p>
            Permanently delete <strong>{patientToDelete.name}</strong>? This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="button button--outline"
              onClick={() => setPatientToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button type="button" className="button" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete patient'}
            </button>
          </div>
        </Modal>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#FFFFFF', color: '#000000', border: '1px solid #000000', borderRadius: 0 },
          success: { iconTheme: { primary: '#000000', secondary: '#FFFFFF' } },
          error: { iconTheme: { primary: '#000000', secondary: '#FFFFFF' } },
        }}
      />
    </>
  )
}

export default App

import { LoaderCircle, LogOut, Pencil, Trash2 } from 'lucide-react'

function PatientTable({ patients, loading, hasActiveFilters, onEdit, onDischarge, onDelete }) {
  if (loading) {
    return (
      <div className="loader" role="status">
        <LoaderCircle className="spin" size={20} aria-hidden="true" />
        <span>Loading patients...</span>
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <div className="empty-state">
        {hasActiveFilters ? (
          <>
            <h3>No matching patients</h3>
            <p>No patients match the current search or filters.</p>
          </>
        ) : (
          <>
            <h3>No patients yet</h3>
            <p>Use "Add patient" to record the first admission.</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table className="patient-table">
        <caption className="visually-hidden">Patient admissions</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Age / Gender</th>
            <th scope="col">Ward</th>
            <th scope="col">Department</th>
            <th scope="col">Doctor</th>
            <th scope="col">Admitted</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td data-label="Name" className="cell-strong">{patient.name}</td>
              <td data-label="Age / Gender">{patient.age} / {patient.gender}</td>
              <td data-label="Ward">{patient.ward}</td>
              <td data-label="Department">{patient.department}</td>
              <td data-label="Doctor">{patient.doctor}</td>
              <td data-label="Admitted">{patient.admission_date}</td>
              <td data-label="Status">
                <span className={`badge badge--${patient.status.toLowerCase()}`}>{patient.status}</span>
              </td>
              <td className="cell-actions">
                <div className="row-actions">
                  <button
                    type="button"
                    className="button button--outline button--compact"
                    title="Edit patient"
                    aria-label={`Edit ${patient.name}`}
                    onClick={() => onEdit(patient)}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  {patient.status === 'Admitted' && (
                    <button
                      type="button"
                      className="button button--outline button--compact"
                      onClick={() => onDischarge(patient)}
                    >
                      <LogOut size={16} aria-hidden="true" />
                      Discharge
                    </button>
                  )}
                  <button
                    type="button"
                    className="button button--outline button--compact"
                    title="Delete patient"
                    aria-label={`Delete ${patient.name}`}
                    onClick={() => onDelete(patient)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PatientTable

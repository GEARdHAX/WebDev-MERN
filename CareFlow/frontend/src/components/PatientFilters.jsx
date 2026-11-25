import { Search } from 'lucide-react'

import { DEPARTMENTS, DOCTORS, WARDS } from '../utils/constants'

function PatientFilters({ filters, onChange, onClear, hasActiveFilters }) {
  return (
    <div className="filters">
      <div className="form-field filters__search">
        <label className="field-label" htmlFor="filter-search">
          Search by name
        </label>
        <div className="input-with-icon">
          <Search size={16} aria-hidden="true" />
          <input
            id="filter-search"
            type="search"
            className="field-input"
            maxLength={120}
            placeholder="e.g. Rahul"
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="field-label" htmlFor="filter-ward">Ward</label>
        <select id="filter-ward" className="field-input" value={filters.ward} onChange={(event) => onChange('ward', event.target.value)}>
          <option value="">All wards</option>
          {WARDS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="field-label" htmlFor="filter-department">Department</label>
        <select id="filter-department" className="field-input" value={filters.department} onChange={(event) => onChange('department', event.target.value)}>
          <option value="">All departments</option>
          {DEPARTMENTS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="field-label" htmlFor="filter-doctor">Doctor</label>
        <select id="filter-doctor" className="field-input" value={filters.doctor} onChange={(event) => onChange('doctor', event.target.value)}>
          <option value="">All doctors</option>
          {DOCTORS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <button type="button" className="button button--outline" onClick={onClear} disabled={!hasActiveFilters}>
        Clear filters
      </button>
    </div>
  )
}

export default PatientFilters

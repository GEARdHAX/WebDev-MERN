function PatientStats({ stats }) {
  const items = [
    { label: 'Total patients', value: stats?.total },
    { label: 'Currently admitted', value: stats?.admitted },
    { label: 'Discharged', value: stats?.discharged },
    { label: "Today's admissions", value: stats?.today_admissions },
  ]

  return (
    <div className="stats-grid">
      {items.map((item) => (
        <article className="card stat" key={item.label}>
          <p className="eyebrow">{item.label}</p>
          <p className="stat__value">{item.value ?? '—'}</p>
        </article>
      ))}
    </div>
  )
}

export default PatientStats

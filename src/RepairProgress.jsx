export default function RepairProgress({ repair, progress, projectedReward }) {
  if (!repair) return null

  return (
    <section className="repair-progress" aria-label="Chain repair progress">
      <div className="repair-track" aria-hidden="true">
        {Array.from({ length: repair.total }, (_, index) => (
          <span
            className={index < repair.completed ? 'is-complete' : index === repair.completed ? 'is-active' : ''}
            key={index}
          />
        ))}
      </div>
      <div>
        <strong>Re-mining Block #{repair.currentIndex}</strong>
        <span>{repair.completed} / {repair.total} repaired · reward {projectedReward} ♦</span>
      </div>
      <code>{progress.hash || 'Searching for a repair hash…'}</code>
    </section>
  )
}

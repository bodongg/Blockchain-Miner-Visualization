export default function MissionPanel({
  mode,
  chainIsValid,
  chainLength,
  difficulty,
  firstInvalidIndex,
  challenge,
  attack,
  onStartChallenge,
  onStartAttack,
  onStartRepair,
  onCancel,
}) {
  const isBusy = ['auto-queued', 'mining', 'challenge', 'repairing', 'attack-countdown'].includes(mode)
  const attackLocked = !chainIsValid || chainLength < 3 || mode !== 'idle'

  return (
    <section className="mission-board stone-panel" aria-labelledby="missions-title">
      <header className="pixel-panel-heading">
        <h2 id="missions-title">Mining missions</h2>
      </header>

      <div className="mission-list">
        <article className="mission-card">
          <span className="mission-icon mission-icon--clock" aria-hidden="true" />
          <div>
            <h3>Timed vein</h3>
            <p>Difficulty {difficulty} · limited time and energy · bonus {difficulty * 10} ♦</p>
          </div>
          <button
            type="button"
            className="pixel-button"
            disabled={!chainIsValid || mode !== 'idle'}
            onClick={onStartChallenge}
          >
            Start timed challenge
          </button>
        </article>

        <article className="mission-card mission-card--danger">
          <span className="mission-icon mission-icon--creeper" aria-hidden="true" />
          <div>
            <h3>Attacker raid</h3>
            <p>{chainLength < 3 ? 'Mine two blocks to unlock this raid.' : 'An attacker breaks history. Repair it in 30 seconds.'}</p>
          </div>
          <button
            type="button"
            className="pixel-button pixel-button--danger"
            disabled={attackLocked}
            onClick={onStartAttack}
          >
            Start attacker mode
          </button>
        </article>
      </div>

      {!chainIsValid && mode !== 'repairing' && (
        <div className="repair-callout">
          <span className="item-sprite item-sprite--anvil" aria-hidden="true" />
          <div>
            <strong>Repair queue begins at Block #{firstInvalidIndex}</strong>
            <small>Every later block must be mined again.</small>
          </div>
          <button type="button" className="pixel-button pixel-button--repair" onClick={onStartRepair}>
            Repair chain
          </button>
        </div>
      )}

      {(isBusy || mode === 'defense') && (
        <div className="mission-status" role="status">
          <strong>{mode.replace('-', ' ')}</strong>
          {challenge && <span>{Math.max(0, challenge.energyRemaining).toLocaleString()} energy left</span>}
          {attack && <span>{attack.secondsRemaining}s remaining</span>}
          {isBusy && (
            <button type="button" className="pixel-button pixel-button--small" onClick={onCancel}>
              Cancel activity
            </button>
          )}
        </div>
      )}
    </section>
  )
}

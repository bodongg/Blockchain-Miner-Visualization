export default function GameDashboard({
  diamonds,
  stats,
  chainIsValid,
  mode,
  notification,
  confirmReset,
  onRequestReset,
  onCancelReset,
  onConfirmReset,
}) {
  return (
    <section className="game-hud" aria-label="Miner status">
      <div className="hud-slot hud-slot--diamond" aria-label="Diamond balance">
        <span className="pixel-icon pixel-icon--diamond" aria-hidden="true" />
        <span>
          <small>Diamonds</small>
          <strong>{diamonds}</strong>
        </span>
      </div>
      <div className="hud-slot">
        <span className={`pixel-icon pixel-icon--${chainIsValid ? 'shield' : 'crack'}`} aria-hidden="true" />
        <span>
          <small>Chain</small>
          <strong>{chainIsValid ? 'Secure' : 'Broken'}</strong>
        </span>
      </div>
      <div className="hud-slot">
        <span className="pixel-icon pixel-icon--flame" aria-hidden="true" />
        <span>
          <small>Streak</small>
          <strong>{stats.currentStreak}</strong>
        </span>
      </div>
      <div className="hud-slot">
        <span className="pixel-icon pixel-icon--pick" aria-hidden="true" />
        <span>
          <small>Mode</small>
          <strong>{mode.replace('-', ' ')}</strong>
        </span>
      </div>

      <div className="hud-actions">
        {confirmReset ? (
          <div className="reset-confirm" role="alert">
            <span>Erase this world?</span>
            <button type="button" className="pixel-button pixel-button--danger" onClick={onConfirmReset}>
              Confirm new game
            </button>
            <button type="button" className="pixel-button" onClick={onCancelReset}>
              Keep progress
            </button>
          </div>
        ) : (
          <button type="button" className="pixel-button pixel-button--small" onClick={onRequestReset}>
            New game
          </button>
        )}
      </div>

      {notification && (
        <p className="pixel-toast" role="status">
          {notification}
        </p>
      )}
    </section>
  )
}

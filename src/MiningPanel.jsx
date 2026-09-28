import PickaxeAnimation from './PickaxeAnimation'

function formatTime(milliseconds) {
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`
  return `${(milliseconds / 1000).toFixed(2)} s`
}

export default function MiningPanel({
  data,
  difficulty,
  isMining,
  isSuccess,
  canMine,
  error,
  progress,
  onDataChange,
  onDifficultyChange,
  onStart,
  onCancel,
}) {
  return (
    <section className="workbench" aria-labelledby="mining-title">
      <div className="mining-controls">
        <div className="panel-heading">
          <h2 id="mining-title">Mine the next block</h2>
          <p>
            Add a record, choose the number of leading zeroes, and search for
            a valid nonce.
          </p>
        </div>

        <label className="field-group" htmlFor="block-data">
          <span>Block data</span>
          <textarea
            id="block-data"
            value={data}
            onChange={(event) => onDataChange(event.target.value)}
            placeholder="Example: Alex sends 3 diamonds to Sam"
            disabled={isMining}
            rows="4"
          />
        </label>

        <div className="difficulty-control">
          <div className="difficulty-copy">
            <label htmlFor="difficulty">Difficulty</label>
            <output htmlFor="difficulty">
              {difficulty} {difficulty === 1 ? 'zero' : 'zeroes'}
            </output>
          </div>
          <input
            id="difficulty"
            type="range"
            min="1"
            max="6"
            step="1"
            value={difficulty}
            style={{ '--difficulty-progress': `${((difficulty - 1) / 5) * 100}%` }}
            onChange={(event) => onDifficultyChange(Number(event.target.value))}
            disabled={isMining}
          />
          <div className="range-labels" aria-hidden="true">
            <span>Fast</span>
            <span>Patient</span>
          </div>
          {difficulty >= 5 && (
            <p className="difficulty-warning">
              Difficulty {difficulty} can take a long time on some devices.
            </p>
          )}
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="mining-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onStart}
            disabled={isMining || !canMine}
          >
            <span className="button-gem" aria-hidden="true" />
            {isMining ? 'Mining in progress…' : 'Start mining'}
          </button>
          {isMining && (
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mining-visual">
        <PickaxeAnimation
          isMining={isMining}
          isSuccess={isSuccess}
          attempts={progress.attempts}
          elapsedMs={progress.elapsedMs}
        />
        <div className="mining-readout" aria-live="polite">
          <div>
            <span>Current nonce</span>
            <strong>{progress.nonce.toLocaleString()}</strong>
          </div>
          <div>
            <span>Attempts</span>
            <strong>{progress.attempts.toLocaleString()}</strong>
          </div>
          <div>
            <span>Elapsed</span>
            <strong>{formatTime(progress.elapsedMs)}</strong>
          </div>
          <div className="hash-attempt">
            <span>Current hash attempt</span>
            <code title={progress.hash}>{progress.hash || 'Waiting for a strike…'}</code>
          </div>
        </div>
      </div>
    </section>
  )
}

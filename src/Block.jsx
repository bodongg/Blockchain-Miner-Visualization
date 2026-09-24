import { useState } from 'react'

function shortHash(hash) {
  if (hash.length <= 13) return hash
  return `${hash.slice(0, 7)}…${hash.slice(-5)}`
}

export default function Block({
  block,
  isValid,
  isSelected,
  isNew,
  onSelect,
}) {
  const label = `${block.index === 0 ? 'Genesis block' : 'Block'} ${block.index}, ${
    isValid ? 'valid' : 'invalid'
  }`

  return (
    <li className="chain-slot">
      <button
        type="button"
        className={`block-token ${isValid ? 'is-valid' : 'is-invalid'} ${
          isSelected ? 'is-selected' : ''
        } ${isNew ? 'is-new' : ''}`}
        aria-label={label}
        aria-pressed={isSelected}
        onClick={() => onSelect(block.index)}
      >
        <span className="block-token__ore" aria-hidden="true" />
        <span className="block-token__index">#{block.index}</span>
        <span className="block-token__hash">{shortHash(block.hash)}</span>
        <span className="block-token__state">
          {isValid ? 'Verified' : 'Broken'}
        </span>
      </button>
    </li>
  )
}

export function BlockInspector({ block, isValid, validationReason, isMining, onSave }) {
  const [draft, setDraft] = useState(block.data)
  const [hasSaved, setHasSaved] = useState(false)
  const hasChanges = draft !== block.data
  const statusLabel = isValid
    ? 'Hash verified'
    : validationReason === 'downstream-of-invalid-block'
      ? 'Earlier block broken'
      : validationReason === 'link-mismatch'
        ? 'Previous hash link broken'
        : 'Hash mismatch'

  function handleSave() {
    if (!hasChanges || isMining) return
    onSave(block.index, draft)
    setHasSaved(true)
  }

  return (
    <aside className="block-inspector" aria-label={`Block ${block.index} details`}>
      <div className="inspector-heading">
        <div>
          <h3>Block #{block.index}</h3>
        </div>
        <span className={`state-chip ${isValid ? 'is-valid' : 'is-invalid'}`}>
          {statusLabel}
        </span>
      </div>

      {block.index === 0 ? (
        <p className="genesis-copy">{block.data}</p>
      ) : (
        <label className="field-group" htmlFor={`edit-block-${block.index}`}>
          <span>Edit block {block.index} data</span>
          <textarea
            id={`edit-block-${block.index}`}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value)
              setHasSaved(false)
            }}
            disabled={isMining}
            rows="3"
          />
        </label>
      )}

      <dl className="block-facts">
        <div>
          <dt>Nonce</dt>
          <dd>{block.nonce.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Previous hash</dt>
          <dd title={block.previousHash}>{shortHash(block.previousHash)}</dd>
        </div>
        <div>
          <dt>Stored hash</dt>
          <dd title={block.hash}>{block.hash}</dd>
        </div>
      </dl>

      {block.index > 0 && (
        <div className="inspector-actions">
          <p role={hasSaved && !isMining ? 'status' : undefined}>
            {isMining
              ? 'Finish or cancel mining before editing this block.'
              : hasSaved
              ? `Saved. This block is ${isValid ? 'verified' : 'marked invalid'}.`
              : hasChanges
                ? 'Saving will recheck this block and every block after it.'
                : 'Edit the text above to change this block.'}
          </p>
          <button
            type="button"
            className="secondary-button danger-action"
            onClick={handleSave}
            disabled={!hasChanges || isMining}
          >
            Save changes
          </button>
        </div>
      )}
    </aside>
  )
}

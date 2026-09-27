import Block, { BlockInspector } from './Block'

export default function ChainRow({
  chain,
  validation,
  isMining,
  selectedIndex,
  newBlockIndex,
  onSelect,
  onEdit,
}) {
  const firstInvalid = validation.find((result) => !result.isValid)
  const selectedBlock = chain.find((block) => block.index === selectedIndex)
  const selectedValidation = validation.find(
    (result) => result.index === selectedIndex,
  )

  return (
    <section className="chain-section" aria-labelledby="chain-title">
      <div className="chain-heading">
        <div>
          <h2 id="chain-title">Blockchain inventory</h2>
        </div>
        <div
          className={`chain-banner ${firstInvalid ? 'is-invalid' : 'is-valid'}`}
          role="status"
          aria-live="polite"
        >
          <span className="status-beacon" aria-hidden="true" />
          <span>
            <strong>
              {firstInvalid
                ? `Chain broken at block #${firstInvalid.index}`
                : 'Chain verified'}
            </strong>
            <small>
              {firstInvalid
                ? 'This block and every block after it can no longer be trusted.'
                : `${chain.length} ${chain.length === 1 ? 'block' : 'blocks'} linked and intact.`}
            </small>
          </span>
        </div>
      </div>

      <div className="chain-scroll" aria-label="Blocks in chain">
        <ol className="chain-list">
          {chain.map((block) => {
            const result = validation.find((item) => item.index === block.index)
            return (
              <Block
                key={block.index}
                block={block}
                isValid={result?.isValid ?? false}
                isSelected={selectedIndex === block.index}
                isNew={newBlockIndex === block.index}
                onSelect={onSelect}
              />
            )
          })}
        </ol>
      </div>

      {selectedBlock && selectedValidation && (
        <BlockInspector
          key={selectedBlock.index}
          block={selectedBlock}
          isValid={selectedValidation.isValid}
          validationReason={selectedValidation.reason}
          isMining={isMining}
          onSave={onEdit}
        />
      )}
    </section>
  )
}

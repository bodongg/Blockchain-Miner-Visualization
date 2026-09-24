import { UPGRADE_DEFINITIONS } from './game/gameConfig'

const ICONS = {
  pickaxe: 'pick',
  batch: 'chest',
  autoMiner: 'redstone',
}

export default function UpgradeShop({
  diamonds,
  upgrades,
  mode,
  canRunAutoMine,
  onPurchase,
  onRunAutoMine,
}) {
  return (
    <section className="upgrade-shop stone-panel" aria-labelledby="shop-title">
      <header className="pixel-panel-heading">
        <h2 id="shop-title">Tool upgrades</h2>
      </header>
      <div className="upgrade-grid">
        {Object.entries(UPGRADE_DEFINITIONS).map(([id, definition]) => {
          const level = upgrades[id]
          const price = definition.prices[level]
          const isMax = level >= 3
          const canAfford = diamonds >= price

          return (
            <article className="upgrade-slot" key={id}>
              <span className={`item-sprite item-sprite--${ICONS[id]}`} aria-hidden="true" />
              <div>
                <h3>{definition.name} · Level {level}</h3>
                <p>{isMax ? 'Maximum level reached' : `Next level: ${level + 1}`}</p>
              </div>
              <button
                type="button"
                className={`pixel-button pixel-button--buy ${canAfford ? '' : 'is-unaffordable'}`}
                disabled={mode !== 'idle' || isMax}
                onClick={() => onPurchase(id)}
                aria-label={
                  isMax
                    ? `${definition.name} maximum level`
                    : `Buy ${definition.name} level ${level + 1} for ${price} diamonds`
                }
              >
                {isMax ? 'MAX' : `${price} ♦`}
              </button>
            </article>
          )
        })}
      </div>

      <div className={`auto-toggle ${upgrades.autoMiner === 0 ? 'is-locked' : ''}`}>
        <span>
          {upgrades.autoMiner === 0
            ? 'Auto Miner — unlock level 1'
            : 'Auto Miner only starts when you click Run.'}
        </span>
        <button
          type="button"
          className="pixel-button pixel-button--repair"
          disabled={
            upgrades.autoMiner === 0 || mode !== 'idle' || !canRunAutoMine
          }
          onClick={onRunAutoMine}
        >
          Run Auto Miner
        </button>
      </div>
    </section>
  )
}

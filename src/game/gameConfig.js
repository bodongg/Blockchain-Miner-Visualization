export const UPGRADE_DEFINITIONS = {
  pickaxe: {
    name: 'Faster pickaxe',
    prices: [20, 60, 140],
    values: [48, 32, 20, 8],
  },
  batch: {
    name: 'Larger batch',
    prices: [25, 75, 175],
    values: [250, 500, 1000, 2000],
  },
  autoMiner: {
    name: 'Auto miner',
    prices: [40, 100, 220],
    values: [null, 900, 450, 150],
  },
}

export function getMiningReward(difficulty) {
  return 5 * difficulty
}

export function getRepairReward(difficulty, repairedCount) {
  return 3 * difficulty * repairedCount + 10
}

export function getChallengeConfig(difficulty) {
  return {
    difficulty,
    timeLimitMs: (10 + difficulty * 5) * 1000,
    maxAttempts: 2 * 16 ** difficulty,
    bonus: 10 * difficulty,
  }
}

export function getMiningOptions(upgrades) {
  return {
    batchDelayMs: UPGRADE_DEFINITIONS.pickaxe.values[upgrades.pickaxe],
    batchSize: UPGRADE_DEFINITIONS.batch.values[upgrades.batch],
    autoMineDelayMs:
      UPGRADE_DEFINITIONS.autoMiner.values[upgrades.autoMiner],
  }
}

export function canPurchaseUpgrade(state, upgradeId) {
  const definition = UPGRADE_DEFINITIONS[upgradeId]
  if (!definition) return false

  const level = state.upgrades[upgradeId]
  const price = definition.prices[level]
  return level < 3 && price !== undefined && state.diamonds >= price
}

export function purchaseUpgrade(state, upgradeId) {
  if (!canPurchaseUpgrade(state, upgradeId)) return state

  const level = state.upgrades[upgradeId]
  const price = UPGRADE_DEFINITIONS[upgradeId].prices[level]

  return {
    ...state,
    diamonds: state.diamonds - price,
    upgrades: {
      ...state.upgrades,
      [upgradeId]: level + 1,
    },
  }
}

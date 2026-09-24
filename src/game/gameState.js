import { calculateHash } from '../utils/hash'

export const STORAGE_KEY = 'mini-blockchain-miner:v2'
export const GENESIS_DATA = 'Genesis Block — The chain begins here.'

export function createGenesisBlock() {
  const block = {
    index: 0,
    data: GENESIS_DATA,
    previousHash: '0',
    nonce: 0,
  }

  return {
    ...block,
    hash: calculateHash(0, GENESIS_DATA, '0', 0),
  }
}

export function createFreshGameState() {
  return {
    version: 2,
    chain: [createGenesisBlock()],
    diamonds: 0,
    upgrades: { pickaxe: 0, batch: 0, autoMiner: 0 },
    autoMineEnabled: false,
    stats: {
      blocksMined: 0,
      blocksRepaired: 0,
      challengesWon: 0,
      defensesWon: 0,
      bestChallengeMs: null,
      currentStreak: 0,
    },
  }
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0
}

function isBlock(block, position) {
  return (
    block !== null &&
    typeof block === 'object' &&
    block.index === position &&
    typeof block.data === 'string' &&
    typeof block.previousHash === 'string' &&
    isNonNegativeInteger(block.nonce) &&
    typeof block.hash === 'string'
  )
}

function isStats(stats) {
  return (
    stats !== null &&
    typeof stats === 'object' &&
    isNonNegativeInteger(stats.blocksMined) &&
    isNonNegativeInteger(stats.blocksRepaired) &&
    isNonNegativeInteger(stats.challengesWon) &&
    isNonNegativeInteger(stats.defensesWon) &&
    (stats.bestChallengeMs === null ||
      (typeof stats.bestChallengeMs === 'number' && stats.bestChallengeMs >= 0)) &&
    isNonNegativeInteger(stats.currentStreak)
  )
}

function isUpgradeSet(upgrades) {
  return (
    upgrades !== null &&
    typeof upgrades === 'object' &&
    ['pickaxe', 'batch', 'autoMiner'].every(
      (key) => Number.isInteger(upgrades[key]) && upgrades[key] >= 0 && upgrades[key] <= 3,
    )
  )
}

function isValidSavedGame(value) {
  if (
    value === null ||
    typeof value !== 'object' ||
    value.version !== 2 ||
    !Array.isArray(value.chain) ||
    value.chain.length === 0 ||
    !value.chain.every(isBlock) ||
    !isNonNegativeInteger(value.diamonds) ||
    !isUpgradeSet(value.upgrades) ||
    typeof value.autoMineEnabled !== 'boolean' ||
    !isStats(value.stats)
  ) {
    return false
  }

  const expectedGenesis = createGenesisBlock()
  return Object.keys(expectedGenesis).every(
    (key) => value.chain[0][key] === expectedGenesis[key],
  )
}

export function parseSavedGame(raw) {
  try {
    const value = JSON.parse(raw)
    return isValidSavedGame(value) ? value : createFreshGameState()
  } catch {
    return createFreshGameState()
  }
}

export function loadGame(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    return raw ? parseSavedGame(raw) : createFreshGameState()
  } catch {
    return createFreshGameState()
  }
}

export function saveGame(storage, state) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearSavedGame(storage) {
  try {
    storage?.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

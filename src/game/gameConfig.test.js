import { describe, expect, it } from 'vitest'
import {
  UPGRADE_DEFINITIONS,
  canPurchaseUpgrade,
  getChallengeConfig,
  getMiningOptions,
  getMiningReward,
  getRepairReward,
  purchaseUpgrade,
} from './gameConfig'

describe('game configuration', () => {
  it('calculates mining and completed-chain repair rewards', () => {
    expect(getMiningReward(3)).toBe(15)
    expect(getRepairReward(2, 3)).toBe(28)
  })

  it('scales challenge time, energy, and bonus from difficulty', () => {
    expect(getChallengeConfig(3)).toEqual({
      difficulty: 3,
      timeLimitMs: 25_000,
      maxAttempts: 8_192,
      bonus: 30,
    })
  })

  it('combines upgrade levels into miner options', () => {
    expect(getMiningOptions({ pickaxe: 2, batch: 1, autoMiner: 0 })).toEqual({
      batchDelayMs: 20,
      batchSize: 500,
      autoMineDelayMs: null,
    })
  })

  it('purchases an upgrade without mutating the existing progression', () => {
    const state = {
      diamonds: UPGRADE_DEFINITIONS.pickaxe.prices[0],
      upgrades: { pickaxe: 0, batch: 0, autoMiner: 0 },
    }

    expect(canPurchaseUpgrade(state, 'pickaxe')).toBe(true)
    expect(purchaseUpgrade(state, 'pickaxe')).toEqual({
      diamonds: 0,
      upgrades: { pickaxe: 1, batch: 0, autoMiner: 0 },
    })
    expect(state.upgrades.pickaxe).toBe(0)
  })

  it('rejects unaffordable, unknown, and maximum-level purchases', () => {
    const state = {
      diamonds: 10,
      upgrades: { pickaxe: 3, batch: 0, autoMiner: 0 },
    }

    expect(canPurchaseUpgrade(state, 'pickaxe')).toBe(false)
    expect(canPurchaseUpgrade(state, 'missing')).toBe(false)
    expect(purchaseUpgrade(state, 'pickaxe')).toBe(state)
    expect(purchaseUpgrade(state, 'missing')).toBe(state)
  })
})

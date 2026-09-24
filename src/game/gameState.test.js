import { describe, expect, it, vi } from 'vitest'
import { calculateHash } from '../utils/hash'
import {
  STORAGE_KEY,
  clearSavedGame,
  createFreshGameState,
  loadGame,
  parseSavedGame,
  saveGame,
} from './gameState'

describe('persistent game state', () => {
  it('creates a fresh progression with a valid genesis block', () => {
    const fresh = createFreshGameState()

    expect(fresh).toEqual(
      expect.objectContaining({
        version: 2,
        diamonds: 0,
        upgrades: { pickaxe: 0, batch: 0, autoMiner: 0 },
        autoMineEnabled: false,
      }),
    )
    expect(fresh.chain).toHaveLength(1)
    expect(fresh.chain[0].hash).toBe(
      calculateHash(0, fresh.chain[0].data, '0', 0),
    )
  })

  it('round-trips a valid saved game', () => {
    const saved = {
      ...createFreshGameState(),
      diamonds: 42,
      upgrades: { pickaxe: 1, batch: 2, autoMiner: 0 },
    }

    expect(parseSavedGame(JSON.stringify(saved))).toEqual(saved)
  })

  it.each([
    '{bad json',
    JSON.stringify({ version: 1 }),
    JSON.stringify({ ...createFreshGameState(), diamonds: -1 }),
    JSON.stringify({
      ...createFreshGameState(),
      upgrades: { pickaxe: 4, batch: 0, autoMiner: 0 },
    }),
  ])('falls back safely for corrupt progress', (raw) => {
    expect(parseSavedGame(raw)).toEqual(createFreshGameState())
  })

  it('preserves a structurally valid chain that is broken for gameplay', () => {
    const saved = createFreshGameState()
    const second = {
      index: 1,
      data: 'Original data',
      previousHash: saved.chain[0].hash,
      nonce: 2,
    }
    second.hash = calculateHash(
      second.index,
      second.data,
      second.previousHash,
      second.nonce,
    )
    saved.chain.push({ ...second, data: 'Tampered data' })

    expect(parseSavedGame(JSON.stringify(saved)).chain[1].data).toBe(
      'Tampered data',
    )
  })

  it('rejects changed genesis and non-contiguous indexes', () => {
    const changedGenesis = createFreshGameState()
    changedGenesis.chain[0] = { ...changedGenesis.chain[0], data: 'Fake' }

    const skippedIndex = createFreshGameState()
    skippedIndex.chain.push({
      index: 2,
      data: 'Skipped',
      previousHash: skippedIndex.chain[0].hash,
      nonce: 0,
      hash: 'hash',
    })

    expect(parseSavedGame(JSON.stringify(changedGenesis))).toEqual(
      createFreshGameState(),
    )
    expect(parseSavedGame(JSON.stringify(skippedIndex))).toEqual(
      createFreshGameState(),
    )
  })

  it('wraps storage failures without crashing gameplay', () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify(createFreshGameState())),
      setItem: vi.fn(() => {
        throw new Error('quota')
      }),
      removeItem: vi.fn(),
    }

    expect(loadGame(storage)).toEqual(createFreshGameState())
    expect(saveGame(storage, createFreshGameState())).toBe(false)
    expect(clearSavedGame(storage)).toBe(true)
    expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEY)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateHash } from '../utils/hash'
import { mineBlock } from '../utils/mineBlock'
import { validateChain } from '../utils/validateChain'
import { createGenesisBlock } from './gameState'
import { repairChain } from './repairChain'

function createValidChain() {
  const genesis = createGenesisBlock()
  const second = {
    index: 1,
    data: 'Diamond shipment',
    previousHash: genesis.hash,
    nonce: 12,
  }
  second.hash = calculateHash(1, second.data, second.previousHash, second.nonce)
  const third = {
    index: 2,
    data: 'Emerald shipment',
    previousHash: second.hash,
    nonce: 27,
  }
  third.hash = calculateHash(2, third.data, third.previousHash, third.nonce)
  return [genesis, second, third]
}

describe('repairChain', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(callback, 0))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('re-mines the first broken block and every block after it', async () => {
    const chain = createValidChain()
    chain[1] = { ...chain[1], data: 'Changed shipment' }

    const result = await repairChain(chain, 1, {
      mine: mineBlock,
      miningOptions: { batchSize: 25 },
    })

    expect(result.repairedIndexes).toEqual([1, 2])
    expect(result.chain[2].previousHash).toBe(result.chain[1].hash)
    expect(validateChain(result.chain).every((item) => item.isValid)).toBe(true)
    expect(validateChain(chain)[1].isValid).toBe(false)
  })

  it('returns the original valid chain without mining', async () => {
    const chain = createValidChain()
    const mine = vi.fn()

    const result = await repairChain(chain, 1, { mine })

    expect(result).toEqual({ chain, repairedIndexes: [] })
    expect(mine).not.toHaveBeenCalled()
  })

  it('does not mutate the original chain when repair is cancelled', async () => {
    const chain = createValidChain()
    chain[1] = { ...chain[1], data: 'Changed shipment' }
    const original = structuredClone(chain)
    let calls = 0
    const mine = vi.fn(async (candidate) => {
      calls += 1
      if (calls === 2) throw new DOMException('Cancelled', 'AbortError')
      return {
        block: {
          ...candidate,
          nonce: 0,
          hash: calculateHash(
            candidate.index,
            candidate.data,
            candidate.previousHash,
            0,
          ),
        },
      }
    })

    await expect(repairChain(chain, 1, { mine })).rejects.toMatchObject({
      name: 'AbortError',
    })
    expect(chain).toEqual(original)
  })
})

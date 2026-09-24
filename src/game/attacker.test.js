import { describe, expect, it } from 'vitest'
import { createGenesisBlock } from './gameState'
import {
  chooseAttackIndex,
  getEligibleAttackIndexes,
  tamperBlock,
} from './attacker'

const chain = [
  createGenesisBlock(),
  { index: 1, data: 'One', previousHash: 'a', nonce: 1, hash: 'b' },
  { index: 2, data: 'Two', previousHash: 'b', nonce: 2, hash: 'c' },
]

describe('attacker mode rules', () => {
  it('targets only non-genesis blocks when at least two exist', () => {
    expect(getEligibleAttackIndexes(chain)).toEqual([1, 2])
    expect(getEligibleAttackIndexes(chain.slice(0, 2))).toEqual([])
  })

  it('uses the injected random value to select a target', () => {
    expect(chooseAttackIndex(chain, () => 0)).toBe(1)
    expect(chooseAttackIndex(chain, () => 0.999)).toBe(2)
  })

  it('visibly tampers with a cloned target block', () => {
    const changed = tamperBlock(chain, 1)

    expect(changed[1].data).toBe('One [attacked]')
    expect(changed[1].hash).toBe(chain[1].hash)
    expect(chain[1].data).toBe('One')
    expect(changed[0]).toBe(chain[0])
  })

  it('refuses genesis and missing targets', () => {
    expect(() => tamperBlock(chain, 0)).toThrow(/genesis/i)
    expect(() => tamperBlock(chain, 9)).toThrow(/not found/i)
  })
})

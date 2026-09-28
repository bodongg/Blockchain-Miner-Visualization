import { describe, expect, it, vi } from 'vitest'
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
  it('makes every mined block eligible for a raid', () => {
    expect(getEligibleAttackIndexes(chain)).toEqual([1, 2])
    expect(getEligibleAttackIndexes([
      ...chain,
      { index: 3, data: 'Three', previousHash: 'c', nonce: 3, hash: 'd' },
    ])).toEqual([1, 2, 3])
    expect(getEligibleAttackIndexes(chain.slice(0, 2))).toEqual([])
  })

  it('randomly selects a mined block', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.99)

    expect(chooseAttackIndex(chain)).toBe(2)
    expect(chooseAttackIndex(chain.slice(0, 2))).toBeNull()

    random.mockRestore()
  })

  it('visibly tampers with a cloned target block', () => {
    const changed = tamperBlock(chain, 1)

    expect(changed[1].data).toBe('One [attacked]')
    expect(changed[1].hash).toBe(chain[1].hash)
    expect(chain[1].data).toBe('One')
    expect(changed[0]).toBe(chain[0])
  })

  it('changes block data again on a later raid', () => {
    const firstRaid = tamperBlock(chain, 1)
    const secondRaid = tamperBlock(firstRaid, 1)

    expect(secondRaid[1].data).not.toBe(firstRaid[1].data)
    expect(secondRaid[1].hash).toBe(firstRaid[1].hash)
  })

  it('refuses genesis and missing targets', () => {
    expect(() => tamperBlock(chain, 0)).toThrow(/genesis/i)
    expect(() => tamperBlock(chain, 9)).toThrow(/not found/i)
  })
})

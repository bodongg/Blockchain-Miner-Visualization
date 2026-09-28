import { describe, expect, it } from 'vitest'
import { calculateHash } from './hash'

describe('calculateHash', () => {
  it('returns the expected SHA-256 digest for the combined block fields', () => {
    expect(calculateHash(0, 'Genesis Block', '0', 0)).toBe(
      '948368f1eb3c037f19c2200142bf5a1bfecf2a884d06672d092bdd2b6c39f80d',
    )
  })

  it('returns the same digest for the same block fields', () => {
    expect(calculateHash(1, 'Diamond shipment', 'abc123', 42)).toBe(
      calculateHash(1, 'Diamond shipment', 'abc123', 42),
    )
  })

  it.each([
    [2, 'Diamond shipment', 'abc123', 42],
    [1, 'Emerald shipment', 'abc123', 42],
    [1, 'Diamond shipment', 'different', 42],
    [1, 'Diamond shipment', 'abc123', 43],
  ])('changes when any block field changes', (index, data, previousHash, nonce) => {
    expect(calculateHash(index, data, previousHash, nonce)).not.toBe(
      calculateHash(1, 'Diamond shipment', 'abc123', 42),
    )
  })
})

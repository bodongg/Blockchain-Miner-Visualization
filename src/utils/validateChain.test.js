import { describe, expect, it } from 'vitest'
import { calculateHash } from './hash'
import { validateChain } from './validateChain'

function createValidChain() {
  const genesis = {
    index: 0,
    data: 'Genesis Block',
    previousHash: '0',
    nonce: 0,
  }
  genesis.hash = calculateHash(
    genesis.index,
    genesis.data,
    genesis.previousHash,
    genesis.nonce,
  )

  const second = {
    index: 1,
    data: 'Diamond shipment',
    previousHash: genesis.hash,
    nonce: 12,
  }
  second.hash = calculateHash(
    second.index,
    second.data,
    second.previousHash,
    second.nonce,
  )

  const third = {
    index: 2,
    data: 'Emerald shipment',
    previousHash: second.hash,
    nonce: 27,
  }
  third.hash = calculateHash(
    third.index,
    third.data,
    third.previousHash,
    third.nonce,
  )

  return [genesis, second, third]
}

describe('validateChain', () => {
  it('marks every block in an unchanged chain as valid', () => {
    expect(validateChain(createValidChain())).toEqual([
      { index: 0, isValid: true, reason: null },
      { index: 1, isValid: true, reason: null },
      { index: 2, isValid: true, reason: null },
    ])
  })

  it('marks a tampered block and every later block as invalid', () => {
    const chain = createValidChain()
    chain[1] = { ...chain[1], data: 'Tampered shipment' }

    expect(validateChain(chain)).toEqual([
      { index: 0, isValid: true, reason: null },
      { index: 1, isValid: false, reason: 'hash-mismatch' },
      { index: 2, isValid: false, reason: 'downstream-of-invalid-block' },
    ])
  })

  it('detects a previous-hash link that no longer points to the prior block', () => {
    const chain = createValidChain()
    const altered = { ...chain[2], previousHash: 'not-the-previous-hash' }
    altered.hash = calculateHash(
      altered.index,
      altered.data,
      altered.previousHash,
      altered.nonce,
    )
    chain[2] = altered

    expect(validateChain(chain)).toEqual([
      { index: 0, isValid: true, reason: null },
      { index: 1, isValid: true, reason: null },
      { index: 2, isValid: false, reason: 'link-mismatch' },
    ])
  })
})

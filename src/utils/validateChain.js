import { calculateHash } from './hash'

/**
 * Checks every block and carries invalidity forward after the first break.
 * This mirrors a real blockchain: once history changes, later blocks can no
 * longer be trusted even when their own stored fields have not changed.
 */
export function validateChain(chain) {
  let chainBroken = false

  return chain.map((block, position) => {
    if (chainBroken) {
      return {
        index: block.index,
        isValid: false,
        reason: 'downstream-of-invalid-block',
      }
    }

    const recomputedHash = calculateHash(
      block.index,
      block.data,
      block.previousHash,
      block.nonce,
    )

    if (block.hash !== recomputedHash) {
      chainBroken = true
      return { index: block.index, isValid: false, reason: 'hash-mismatch' }
    }

    if (position > 0 && block.previousHash !== chain[position - 1].hash) {
      chainBroken = true
      return { index: block.index, isValid: false, reason: 'link-mismatch' }
    }

    return { index: block.index, isValid: true, reason: null }
  })
}

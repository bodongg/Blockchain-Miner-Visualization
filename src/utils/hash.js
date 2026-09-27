import SHA256 from 'crypto-js/sha256'

/**
 * Combines the four stored block fields and returns their SHA-256 digest.
 * The same inputs always produce the same 64-character hexadecimal hash.
 */
export function calculateHash(index, data, previousHash, nonce) {
  return SHA256(`${index}${data}${previousHash}${nonce}`).toString()
}

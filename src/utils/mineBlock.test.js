import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateHash } from './hash'
import { mineBlock } from './mineBlock'

const candidate = {
  index: 1,
  data: 'Diamond shipment',
  previousHash: 'previous-block-hash',
}

describe('mineBlock', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(callback, 0))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('finds a nonce whose hash satisfies the selected difficulty', async () => {
    const result = await mineBlock(candidate, 1, { batchSize: 8 })

    expect(result.block.hash.startsWith('0')).toBe(true)
    expect(result.block.hash).toBe(
      calculateHash(
        result.block.index,
        result.block.data,
        result.block.previousHash,
        result.block.nonce,
      ),
    )
    expect(result.attempts).toBe(result.block.nonce + 1)
  })

  it('reports the most recent attempt after each unfinished batch', async () => {
    const onProgress = vi.fn()

    await mineBlock(candidate, 2, { batchSize: 1, onProgress })

    expect(onProgress).toHaveBeenCalled()
    expect(onProgress.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        nonce: expect.any(Number),
        hash: expect.any(String),
        attempts: expect.any(Number),
        elapsedMs: expect.any(Number),
      }),
    )
  })

  it.each([0, 7, 1.5])('rejects unsupported difficulty %s', async (difficulty) => {
    await expect(mineBlock(candidate, difficulty)).rejects.toThrow(
      'Difficulty must be an integer from 1 to 6.',
    )
  })

  it('stops immediately when its abort signal is already cancelled', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      mineBlock(candidate, 1, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('stops when challenge energy is exhausted', async () => {
    await expect(
      mineBlock(candidate, 6, { batchSize: 1, maxAttempts: 1 }),
    ).rejects.toMatchObject({ code: 'energy-exhausted' })
  })

  it('stops when the challenge time has expired', async () => {
    await expect(
      mineBlock(candidate, 6, { batchSize: 1, timeLimitMs: 0 }),
    ).rejects.toMatchObject({ code: 'time-expired' })
  })

  it('reports the remaining attempt budget', async () => {
    const onProgress = vi.fn()

    await expect(
      mineBlock(candidate, 6, {
        batchSize: 2,
        maxAttempts: 2,
        onProgress,
      }),
    ).rejects.toMatchObject({ code: 'energy-exhausted' })

    expect(onProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({ attempts: 2, attemptsRemaining: 0 }),
    )
  })
})

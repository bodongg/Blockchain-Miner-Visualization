import { calculateHash } from './hash'

function createAbortError() {
  return new DOMException('Mining cancelled', 'AbortError')
}

export class MiningLimitError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'MiningLimitError'
    this.code = code
  }
}

/**
 * Mines a block without locking the browser. Each animation frame receives a
 * limited batch of nonce attempts, then yields so React can paint progress.
 */
export function mineBlock(
  candidate,
  difficulty,
  {
    onProgress = () => {},
    signal,
    batchSize = 500,
    batchDelayMs = 0,
    maxAttempts = null,
    timeLimitMs = null,
  } = {},
) {
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 6) {
    return Promise.reject(
      new RangeError('Difficulty must be an integer from 1 to 6.'),
    )
  }

  const targetPrefix = '0'.repeat(difficulty)
  const attemptsPerFrame = Math.max(1, Math.floor(batchSize))
  const delay = Math.max(0, Number(batchDelayMs) || 0)
  const attemptLimit =
    Number.isFinite(maxAttempts) && maxAttempts >= 0
      ? Math.floor(maxAttempts)
      : null
  const durationLimit =
    Number.isFinite(timeLimitMs) && timeLimitMs >= 0 ? timeLimitMs : null

  return new Promise((resolve, reject) => {
    let nonce = 0
    let attempts = 0
    const startedAt = performance.now()
    let scheduledId = null
    let scheduledWithTimeout = false
    let settled = false

    function cleanup() {
      signal?.removeEventListener('abort', handleAbort)
      if (scheduledId === null) return
      if (scheduledWithTimeout) {
        clearTimeout(scheduledId)
      } else if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(scheduledId)
      }
      scheduledId = null
    }

    function finish(callback, value) {
      if (settled) return
      settled = true
      cleanup()
      callback(value)
    }

    function handleAbort() {
      finish(reject, createAbortError())
    }

    function reportProgress(currentNonce, currentHash) {
      onProgress({
        nonce: currentNonce,
        hash: currentHash,
        attempts,
        attemptsRemaining:
          attemptLimit === null ? null : Math.max(0, attemptLimit - attempts),
        elapsedMs: performance.now() - startedAt,
      })
    }

    function scheduleNextBatch() {
      if (delay > 16) {
        scheduledWithTimeout = true
        scheduledId = setTimeout(runBatch, delay)
      } else {
        scheduledWithTimeout = false
        scheduledId = requestAnimationFrame(runBatch)
      }
    }

    function runBatch() {
      scheduledId = null
      if (signal?.aborted) {
        finish(reject, createAbortError())
        return
      }

      if (durationLimit !== null && performance.now() - startedAt >= durationLimit) {
        finish(
          reject,
          new MiningLimitError('time-expired', 'The mining timer expired.'),
        )
        return
      }

      let currentNonce = nonce
      let currentHash = ''

      for (let count = 0; count < attemptsPerFrame; count += 1) {
        if (signal?.aborted) {
          finish(reject, createAbortError())
          return
        }

        if (durationLimit !== null && performance.now() - startedAt >= durationLimit) {
          if (attempts > 0) reportProgress(currentNonce, currentHash)
          finish(
            reject,
            new MiningLimitError('time-expired', 'The mining timer expired.'),
          )
          return
        }

        if (attemptLimit !== null && attempts >= attemptLimit) {
          reportProgress(currentNonce, currentHash)
          finish(
            reject,
            new MiningLimitError(
              'energy-exhausted',
              'The mining energy was exhausted.',
            ),
          )
          return
        }

        currentNonce = nonce
        currentHash = calculateHash(
          candidate.index,
          candidate.data,
          candidate.previousHash,
          currentNonce,
        )
        attempts += 1
        nonce += 1

        if (currentHash.startsWith(targetPrefix)) {
          const elapsedMs = performance.now() - startedAt
          reportProgress(currentNonce, currentHash)
          finish(resolve, {
            block: { ...candidate, nonce: currentNonce, hash: currentHash },
            attempts,
            elapsedMs,
          })
          return
        }
      }

      reportProgress(currentNonce, currentHash)
      scheduleNextBatch()
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
    scheduleNextBatch()
  })
}

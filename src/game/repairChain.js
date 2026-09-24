import { mineBlock } from '../utils/mineBlock'
import { validateChain } from '../utils/validateChain'

export async function repairChain(
  chain,
  difficulty,
  {
    mine = mineBlock,
    signal,
    miningOptions = {},
    onBlockStart = () => {},
    onProgress = () => {},
    onBlockComplete = () => {},
  } = {},
) {
  const validation = validateChain(chain)
  const firstInvalidPosition = validation.findIndex((item) => !item.isValid)

  if (firstInvalidPosition === -1) {
    return { chain, repairedIndexes: [] }
  }

  const workingChain = chain.map((block) => ({ ...block }))
  const repairedIndexes = []

  for (let position = firstInvalidPosition; position < workingChain.length; position += 1) {
    const existing = workingChain[position]
    const candidate = {
      index: existing.index,
      data: existing.data,
      previousHash: workingChain[position - 1].hash,
    }

    onBlockStart({
      index: existing.index,
      position: position - firstInvalidPosition,
      total: workingChain.length - firstInvalidPosition,
    })

    const result = await mine(candidate, difficulty, {
      ...miningOptions,
      signal,
      onProgress: (progress) => onProgress({ ...progress, index: existing.index }),
    })

    workingChain[position] = result.block
    repairedIndexes.push(existing.index)
    onBlockComplete({ index: existing.index, block: result.block })
  }

  if (!validateChain(workingChain).every((item) => item.isValid)) {
    throw new Error('Repair completed without producing a valid chain.')
  }

  return { chain: workingChain, repairedIndexes }
}

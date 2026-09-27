export function getEligibleAttackIndexes(chain) {
  // Any mined block can be attacked; earlier blocks remain verifiable.
  return chain.length >= 3 ? chain.slice(1).map((block) => block.index) : []
}

export function chooseAttackIndex(chain) {
  const eligibleIndexes = getEligibleAttackIndexes(chain)
  if (eligibleIndexes.length === 0) return null

  return eligibleIndexes[Math.floor(Math.random() * eligibleIndexes.length)]
}

export function tamperBlock(chain, index) {
  if (index === 0) throw new Error('The genesis block cannot be attacked.')
  if (!chain.some((block) => block.index === index)) {
    throw new Error(`Block ${index} was not found.`)
  }

  return chain.map((block) =>
    block.index === index
      ? { ...block, data: `${block.data} [attacked]` }
      : block,
  )
}

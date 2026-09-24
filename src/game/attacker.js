export function getEligibleAttackIndexes(chain) {
  return chain.length >= 3 ? chain.slice(1).map((block) => block.index) : []
}

export function chooseAttackIndex(chain, random = Math.random) {
  const eligible = getEligibleAttackIndexes(chain)
  if (eligible.length === 0) return null
  const position = Math.min(
    eligible.length - 1,
    Math.floor(Math.max(0, random()) * eligible.length),
  )
  return eligible[position]
}

export function tamperBlock(chain, index) {
  if (index === 0) throw new Error('The genesis block cannot be attacked.')
  if (!chain.some((block) => block.index === index)) {
    throw new Error(`Block ${index} was not found.`)
  }

  return chain.map((block) =>
    block.index === index
      ? { ...block, data: `${block.data.replace(/ \[attacked\]$/, '')} [attacked]` }
      : block,
  )
}

import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import ChainRow from './ChainRow'
import CursorBlock from './CursorBlock'
import GameDashboard from './GameDashboard'
import MiningPanel from './MiningPanel'
import MissionPanel from './MissionPanel'
import RepairProgress from './RepairProgress'
import UpgradeShop from './UpgradeShop'
import { chooseAttackIndex, tamperBlock } from './game/attacker'
import {
  FAILED_DEFENSE_FEE_PER_BLOCK,
  UPGRADE_DEFINITIONS,
  getChallengeConfig,
  getMiningOptions,
  getMiningReward,
  getRepairReward,
  purchaseUpgrade,
} from './game/gameConfig'
import {
  clearSavedGame,
  createFreshGameState,
  loadGame,
  saveGame,
} from './game/gameState'
import { repairChain } from './game/repairChain'
import { mineBlock } from './utils/mineBlock'
import { validateChain } from './utils/validateChain'
import './App.css'

const EMPTY_PROGRESS = {
  nonce: 0,
  hash: '',
  attempts: 0,
  attemptsRemaining: null,
  elapsedMs: 0,
}

function App() {
  const [initialGame] = useState(() => loadGame(window.localStorage))

  const [chain, setChain] = useState(() => initialGame.chain)
  const [diamonds, setDiamonds] = useState(() => initialGame.diamonds)
  const [upgrades, setUpgrades] = useState(() => initialGame.upgrades)
  const [raidRepairFeePending, setRaidRepairFeePending] = useState(
    () => initialGame.raidRepairFeePending,
  )
  const [stats, setStats] = useState(() => initialGame.stats)
  const [data, setData] = useState('')
  const [difficulty, setDifficulty] = useState(2)
  const [mode, setMode] = useState('idle')
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [newBlockIndex, setNewBlockIndex] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [challenge, setChallenge] = useState(null)
  const [attack, setAttack] = useState(null)
  const [repair, setRepair] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const abortControllerRef = useRef(null)
  const successTimerRef = useRef(null)
  const autoMineTimerRef = useRef(null)
  const attackTimerRef = useRef(null)

  const validation = useMemo(() => validateChain(chain), [chain])
  const firstInvalid = validation.find((result) => !result.isValid)
  const chainIsValid = !firstInvalid
  const brokenBlockCount = validation.filter((result) => !result.isValid).length
  const lateRepairCost =
    raidRepairFeePending && attack?.phase !== 'defense'
      ? FAILED_DEFENSE_FEE_PER_BLOCK * brokenBlockCount
      : 0
  const lateRepairCharge = Math.min(diamonds, lateRepairCost)
  const activeMining = ['auto-queued', 'mining', 'challenge', 'repairing'].includes(mode)
  const miningOptions = useMemo(() => getMiningOptions(upgrades), [upgrades])

  useEffect(() => {
    saveGame(window.localStorage, {
      version: 2,
      chain,
      diamonds,
      upgrades,
      autoMineEnabled: false,
      raidRepairFeePending,
      stats,
    })
  }, [chain, diamonds, upgrades, raidRepairFeePending, stats])

  const attackPhase = attack?.phase
  const attackDeadlineMs = attack?.deadlineMs
  const attackTarget = attack?.targetIndex

  useEffect(() => {
    if (!['countdown', 'defense'].includes(attackPhase)) {
      return undefined
    }

    const timerId = window.setInterval(() => {
      const secondsRemaining = Math.max(
        0,
        Math.ceil((attackDeadlineMs - Date.now()) / 1000),
      )

      if (secondsRemaining > 0) {
        setAttack((current) =>
          current?.phase === attackPhase && current.secondsRemaining !== secondsRemaining
            ? { ...current, secondsRemaining }
            : current,
        )
        return
      }

      window.clearInterval(timerId)
      if (attackTimerRef.current === timerId) attackTimerRef.current = null

      if (attackPhase === 'countdown') {
        setChain((current) => tamperBlock(current, attackTarget))
        setRaidRepairFeePending(true)
        setSelectedIndex(attackTarget)
        setAttack({
          phase: 'defense',
          attackedIndex: attackTarget,
          targetIndex: attackTarget,
          secondsRemaining: 30,
          deadlineMs: Date.now() + 30_000,
        })
        setMode('defense')
        setNotification(
          `Attacker changed Block #${attackTarget}. Repair the chain!`,
        )
      } else {
        setAttack((current) => ({ ...current, phase: 'failed', secondsRemaining: 0 }))
        if (mode !== 'repairing') setMode('idle')
        setNotification('Defense failed. Repair costs 5 diamonds per broken block.')
      }
    }, 1000)

    attackTimerRef.current = timerId
    return () => window.clearInterval(timerId)
  }, [attackPhase, attackDeadlineMs, attackTarget, mode])

  useEffect(
    () => () => {
      abortControllerRef.current?.abort()
      window.clearTimeout(successTimerRef.current)
      window.clearTimeout(autoMineTimerRef.current)
      window.clearInterval(attackTimerRef.current)
    },
    [],
  )

  function showSuccess(index) {
    window.clearTimeout(successTimerRef.current)
    setNewBlockIndex(index)
    setIsSuccess(true)
    successTimerRef.current = window.setTimeout(() => {
      setIsSuccess(false)
      setNewBlockIndex(null)
      successTimerRef.current = null
    }, 1100)
  }

  async function runMining(kind = 'normal', requiredMode = 'idle') {
    const trimmedData = data.trim()
    if (!trimmedData) {
      setError('Enter data for this block before mining.')
      setNotification('Enter block data in the mining station first.')
      return
    }
    if (!chainIsValid || mode !== requiredMode) return

    const challengeConfig =
      kind === 'challenge' ? getChallengeConfig(difficulty) : null
    const controller = new AbortController()
    abortControllerRef.current = controller
    setError('')
    setNotification('')
    setProgress(EMPTY_PROGRESS)
    setMode(kind === 'challenge' ? 'challenge' : 'mining')
    setChallenge(
      challengeConfig
        ? { ...challengeConfig, energyRemaining: challengeConfig.maxAttempts }
        : null,
    )

    const previousBlock = chain.at(-1)
    const candidate = {
      index: chain.length,
      data: trimmedData,
      previousHash: previousBlock.hash,
    }

    try {
      const result = await mineBlock(candidate, difficulty, {
        signal: controller.signal,
        batchSize: miningOptions.batchSize,
        batchDelayMs: miningOptions.batchDelayMs,
        maxAttempts: challengeConfig?.maxAttempts,
        timeLimitMs: challengeConfig?.timeLimitMs,
        onProgress: (nextProgress) => {
          setProgress(nextProgress)
          if (challengeConfig) {
            setChallenge((current) =>
              current
                ? {
                    ...current,
                    energyRemaining:
                      nextProgress.attemptsRemaining ??
                      current.energyRemaining,
                  }
                : current,
            )
          }
        },
      })

      const baseReward = getMiningReward(difficulty)
      const totalReward = baseReward + (challengeConfig?.bonus ?? 0)
      setChain((current) => [...current, result.block])
      setDiamonds((current) => current + totalReward)
      setStats((current) => ({
        ...current,
        blocksMined: current.blocksMined + 1,
        challengesWon:
          current.challengesWon + (challengeConfig ? 1 : 0),
        currentStreak: challengeConfig
          ? current.currentStreak + 1
          : current.currentStreak,
        bestChallengeMs: challengeConfig
          ? current.bestChallengeMs === null
            ? result.elapsedMs
            : Math.min(current.bestChallengeMs, result.elapsedMs)
          : current.bestChallengeMs,
      }))
      setData('')
      setSelectedIndex(result.block.index)
      setNotification(
        challengeConfig
          ? `Challenge complete! +${totalReward} diamonds.`
          : `Block mined! +${totalReward} diamonds.`,
      )
      showSuccess(result.block.index)
    } catch (miningError) {
      if (miningError.name === 'AbortError') {
        setError('Mining cancelled. Your existing chain is unchanged.')
      } else if (miningError.code === 'energy-exhausted') {
        setError('Challenge failed: your mining energy ran out.')
        setStats((current) => ({ ...current, currentStreak: 0 }))
      } else if (miningError.code === 'time-expired') {
        setError('Challenge failed: the timer expired.')
        setStats((current) => ({ ...current, currentStreak: 0 }))
      } else {
        setError('Mining stopped unexpectedly. Please try again.')
      }
    } finally {
      setMode('idle')
      setChallenge(null)
      abortControllerRef.current = null
    }
  }

  const runAutomaticMining = useEffectEvent(() =>
    runMining('normal', 'auto-queued'),
  )

  useEffect(() => {
    if (mode !== 'auto-queued') return undefined

    autoMineTimerRef.current = window.setTimeout(
      runAutomaticMining,
      miningOptions.autoMineDelayMs,
    )
    return () => window.clearTimeout(autoMineTimerRef.current)
  }, [mode, miningOptions.autoMineDelayMs])

  function handleStartAutoMine() {
    if (upgrades.autoMiner === 0 || mode !== 'idle' || !chainIsValid) return

    if (!data.trim()) {
      setError('Enter data for this block before starting the Auto Miner.')
      setNotification('Enter block data in the mining station first.')
      return
    }

    window.clearTimeout(autoMineTimerRef.current)
    setError('')
    setProgress(EMPTY_PROGRESS)
    setMode('auto-queued')
    setNotification(
      `Auto Miner warming up for ${miningOptions.autoMineDelayMs} ms.`,
    )
  }

  async function handleStartRepair() {
    if (!firstInvalid || !['idle', 'defense'].includes(mode)) return

    const defenseDeadlineMs =
      attack?.phase === 'defense' ? attack.deadlineMs : null
    const startedDefense = defenseDeadlineMs !== null
    let repairSucceeded = false
    const controller = new AbortController()
    abortControllerRef.current = controller
    setError('')
    setNotification('')
    setProgress(EMPTY_PROGRESS)
    setMode('repairing')

    try {
      const result = await repairChain(chain, difficulty, {
        mine: mineBlock,
        signal: controller.signal,
        miningOptions: {
          batchSize: miningOptions.batchSize,
          batchDelayMs: miningOptions.batchDelayMs,
        },
        onBlockStart: ({ index, position, total }) =>
          setRepair({
            startIndex: firstInvalid.index,
            currentIndex: index,
            completed: position,
            total,
          }),
        onProgress: setProgress,
        onBlockComplete: () =>
          setRepair((current) =>
            current
              ? { ...current, completed: current.completed + 1 }
              : current,
          ),
      })

      const defendedInTime =
        startedDefense && Date.now() < defenseDeadlineMs
      const feeApplies = raidRepairFeePending && !defendedInTime
      const repairCost = feeApplies
        ? FAILED_DEFENSE_FEE_PER_BLOCK * result.repairedIndexes.length
        : 0
      const chargedDiamonds = Math.min(diamonds, repairCost)
      const repairReward = feeApplies
        ? 0
        : getRepairReward(difficulty, result.repairedIndexes.length)
      const defenseBonus = defendedInTime ? 30 : 0
      setChain(result.chain)
      setDiamonds((current) =>
        Math.max(0, current - repairCost) + repairReward + defenseBonus,
      )
      setStats((current) => ({
        ...current,
        blocksRepaired:
          current.blocksRepaired + result.repairedIndexes.length,
        defensesWon: current.defensesWon + (defendedInTime ? 1 : 0),
      }))
      setRaidRepairFeePending(false)
      setAttack(null)
      repairSucceeded = true
      setNotification(
        defendedInTime
          ? `Defense won! +${repairReward + defenseBonus} diamonds.`
          : feeApplies
            ? `Chain repaired. ${chargedDiamonds} diamonds charged for the failed defense.`
            : `Chain repaired! +${repairReward} diamonds.`,
      )
    } catch (repairError) {
      setError(
        repairError.name === 'AbortError'
          ? 'Repair cancelled. The broken chain is unchanged.'
          : 'Repair failed unexpectedly. Please try again.',
      )
    } finally {
      setRepair(null)
      const defenseStillActive =
        startedDefense && Date.now() < defenseDeadlineMs
      if (!repairSucceeded && startedDefense && !defenseStillActive) {
        setAttack((current) =>
          current?.phase === 'defense'
            ? { ...current, phase: 'failed', secondsRemaining: 0 }
            : current,
        )
      }
      setMode(repairSucceeded ? 'idle' : defenseStillActive ? 'defense' : 'idle')
      abortControllerRef.current = null
    }
  }

  function handleCancelActivity() {
    if (mode === 'auto-queued') {
      window.clearTimeout(autoMineTimerRef.current)
      autoMineTimerRef.current = null
      setMode('idle')
      setNotification('Auto Miner cancelled.')
      return
    }
    if (mode === 'attack-countdown') {
      setAttack(null)
      setMode('idle')
      setNotification('Attacker raid cancelled.')
      return
    }
    abortControllerRef.current?.abort()
  }

  function handleEditBlock(index, nextData) {
    if (index === 0 || mode !== 'idle') return
    const updatedChain = chain.map((block) =>
      block.index === index ? { ...block, data: nextData } : block,
    )
    const restoresChain =
      raidRepairFeePending &&
      validateChain(updatedChain).every((result) => result.isValid)

    setChain(updatedChain)
    if (restoresChain) {
      const chargedDiamonds = Math.min(diamonds, lateRepairCost)
      setDiamonds((current) => Math.max(0, current - lateRepairCost))
      setRaidRepairFeePending(false)
      setAttack(null)
      setNotification(
        `Chain restored. ${chargedDiamonds} diamonds charged for the failed defense.`,
      )
    } else {
      setNotification(`Block #${index} changed. The chain needs repair.`)
    }
  }

  function handlePurchase(upgradeId) {
    if (mode !== 'idle') return
    const level = upgrades[upgradeId]
    const price = UPGRADE_DEFINITIONS[upgradeId].prices[level]
    if (diamonds < price) {
      setNotification(
        `Need ${price - diamonds} more diamonds. Mine blocks to earn them.`,
      )
      return
    }
    const next = purchaseUpgrade({ diamonds, upgrades }, upgradeId)
    if (next.diamonds === diamonds && next.upgrades === upgrades) return
    setDiamonds(next.diamonds)
    setUpgrades(next.upgrades)
    const name =
      upgradeId === 'autoMiner'
        ? 'Auto miner'
        : upgradeId === 'pickaxe'
          ? 'Faster pickaxe'
          : 'Larger batch'
    setNotification(`${name} upgraded!`)
  }

  function handleStartAttack() {
    if (!chainIsValid || mode !== 'idle') return
    const targetIndex = chooseAttackIndex(chain)
    if (targetIndex === null) {
      setError('Mine at least two blocks before starting attacker mode.')
      return
    }
    setRaidRepairFeePending(false)
    setAttack({
      phase: 'countdown',
      targetIndex,
      attackedIndex: null,
      secondsRemaining: 5,
      deadlineMs: Date.now() + 5_000,
    })
    setMode('attack-countdown')
    setNotification('Attacker incoming! Secure your chain.')
  }

  function handleConfirmNewGame() {
    abortControllerRef.current?.abort()
    window.clearTimeout(successTimerRef.current)
    window.clearTimeout(autoMineTimerRef.current)
    window.clearInterval(attackTimerRef.current)
    clearSavedGame(window.localStorage)
    const fresh = createFreshGameState()
    setChain(fresh.chain)
    setDiamonds(fresh.diamonds)
    setUpgrades(fresh.upgrades)
    setRaidRepairFeePending(false)
    setStats(fresh.stats)
    setData('')
    setMode('idle')
    setProgress(EMPTY_PROGRESS)
    setError('')
    setNotification('New world created.')
    setSelectedIndex(null)
    setNewBlockIndex(null)
    setIsSuccess(false)
    setChallenge(null)
    setAttack(null)
    setRepair(null)
    setConfirmReset(false)
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a
          className="brand"
          href="#top"
          aria-label="Mini Blockchain Miner home"
        >
          <span className="brand-cube" aria-hidden="true" />
          <span>Mini Blockchain Miner</span>
        </a>
        <span className="world-label">Local world · SHA-256</span>
      </header>

      <section className="intro" id="top">
        <h1>
          Mine. Upgrade.
          <br />
          Defend the chain.
        </h1>
        <p>
          Every block remembers the one before it. Earn diamonds by mining,
          then survive attacks by rebuilding history one hash at a time.
        </p>
      </section>

      <GameDashboard
        diamonds={diamonds}
        stats={stats}
        chainIsValid={chainIsValid}
        mode={mode}
        notification={notification}
        confirmReset={confirmReset}
        onRequestReset={() => setConfirmReset(true)}
        onCancelReset={() => setConfirmReset(false)}
        onConfirmReset={handleConfirmNewGame}
      />

      <div className="game-grid">
        <MissionPanel
          mode={mode}
          chainIsValid={chainIsValid}
          chainLength={chain.length}
          difficulty={difficulty}
          firstInvalidIndex={firstInvalid?.index}
          lateRepairCost={lateRepairCost}
          lateRepairCharge={lateRepairCharge}
          challenge={challenge}
          attack={attack}
          onStartChallenge={() => runMining('challenge')}
          onStartAttack={handleStartAttack}
          onStartRepair={handleStartRepair}
          onCancel={handleCancelActivity}
        />
        <UpgradeShop
          diamonds={diamonds}
          upgrades={upgrades}
          mode={mode}
          canRunAutoMine={chainIsValid}
          onPurchase={handlePurchase}
          onRunAutoMine={handleStartAutoMine}
        />
      </div>

      <MiningPanel
        data={data}
        difficulty={difficulty}
        isMining={activeMining}
        isSuccess={isSuccess}
        canMine={chainIsValid && mode === 'idle'}
        error={error}
        progress={progress}
        onDataChange={(value) => {
          setData(value)
          if (error) setError('')
        }}
        onDifficultyChange={setDifficulty}
        onStart={() => runMining('normal')}
        onCancel={handleCancelActivity}
      />

      <RepairProgress
        repair={repair}
        progress={progress}
        projectedReward={
          repair ? getRepairReward(difficulty, repair.total) : 0
        }
        lateRepairCharge={lateRepairCharge}
        feeApplies={lateRepairCost > 0}
      />

      <ChainRow
        chain={chain}
        validation={validation}
        isMining={mode !== 'idle'}
        selectedIndex={selectedIndex}
        newBlockIndex={newBlockIndex}
        onSelect={setSelectedIndex}
        onEdit={handleEditBlock}
      />

      <footer className="site-footer">
        <p>Saved in this browser · no backend · no data leaves this page</p>
        <p>SHA-256 · Proof of work · Chain repair</p>
      </footer>
      <CursorBlock />
    </main>
  )
}

export default App

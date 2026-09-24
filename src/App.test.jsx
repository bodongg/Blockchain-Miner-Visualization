import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { calculateHash } from './utils/hash'
import { mineBlock } from './utils/mineBlock'
import { createFreshGameState, STORAGE_KEY } from './game/gameState'

vi.mock('./utils/mineBlock', () => ({
  mineBlock: vi.fn(),
}))

describe('Mini Blockchain Miner', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useRealTimers()
    mineBlock.mockImplementation(
      async (candidate, difficulty, { onProgress }) => {
        const target = '0'.repeat(difficulty)
        let nonce = 0
        let hash = calculateHash(
          candidate.index,
          candidate.data,
          candidate.previousHash,
          nonce,
        )

        while (!hash.startsWith(target)) {
          nonce += 1
          hash = calculateHash(
            candidate.index,
            candidate.data,
            candidate.previousHash,
            nonce,
          )
        }

        const progress = {
          nonce,
          hash,
          attempts: nonce + 1,
          elapsedMs: 8,
        }
        onProgress(progress)

        return {
          block: { ...candidate, nonce, hash },
          attempts: nonce + 1,
          elapsedMs: 8,
        }
      },
    )
  })

  it('shows genesis block zero as a read-only block', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      screen.getByRole('button', { name: /genesis block 0/i }),
    )

    expect(screen.getByText(/the chain begins here/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /save changes/i }),
    ).not.toBeInTheDocument()
  })

  it('asks for block data instead of starting an empty mining job', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start mining/i }))

    expect(screen.getByText(/enter data for this block/i)).toBeInTheDocument()
    expect(mineBlock).not.toHaveBeenCalled()
  })

  it('adds a successfully mined block to the chain row', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/block data/i), 'Diamond shipment')
    await user.click(screen.getByRole('button', { name: /start mining/i }))

    expect(
      await screen.findByRole('button', { name: /block 1, valid/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/chain verified/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/diamond balance/i)).toHaveTextContent('10')
  })

  it('marks an edited block and the remaining chain as broken', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/block data/i), 'Diamond shipment')
    await user.click(screen.getByRole('button', { name: /start mining/i }))
    await screen.findByRole('button', { name: /block 1, valid/i })
    await user.type(screen.getByLabelText(/block data/i), 'Emerald shipment')
    await user.click(screen.getByRole('button', { name: /start mining/i }))
    await screen.findByRole('button', { name: /block 2, valid/i })
    await user.click(
      screen.getByRole('button', { name: /block 1, valid/i }),
    )

    const editor = screen.getByLabelText(/edit block 1 data/i)
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeDisabled()

    await user.clear(editor)
    await user.type(editor, 'Tampered shipment')
    expect(saveButton).toBeEnabled()
    await user.click(saveButton)

    expect(screen.getByText(/chain broken at block #1/i)).toBeInTheDocument()
    expect(screen.getByText(/saved.*block is marked invalid/i)).toBeInTheDocument()
    expect(saveButton).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /block 2, invalid/i }))
    expect(screen.getByText(/earlier block broken/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start mining/i })).toBeDisabled()
  })

  it('re-mines every broken block and restores the chain', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/block data/i), 'First record')
    await user.click(screen.getByRole('button', { name: /start mining/i }))
    await screen.findByRole('button', { name: /block 1, valid/i })
    await user.type(screen.getByLabelText(/block data/i), 'Second record')
    await user.click(screen.getByRole('button', { name: /start mining/i }))
    await screen.findByRole('button', { name: /block 2, valid/i })
    await user.click(screen.getByRole('button', { name: /block 1, valid/i }))
    await user.clear(screen.getByLabelText(/edit block 1 data/i))
    await user.type(screen.getByLabelText(/edit block 1 data/i), 'Changed')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await user.click(screen.getByRole('button', { name: /repair chain/i }))

    expect(await screen.findByText(/^chain verified$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /block 1, valid/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /block 2, valid/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/diamond balance/i)).toHaveTextContent('42')
  })

  it('awards a challenge bonus after a successful timed mine', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/block data/i), 'Challenge record')
    await user.click(screen.getByRole('button', { name: /start timed challenge/i }))

    expect(await screen.findByRole('button', { name: /block 1, valid/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/diamond balance/i)).toHaveTextContent('30')
    expect(screen.getByText(/challenge complete/i)).toBeInTheDocument()
  })

  it('shows missing block data feedback beside the mission controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start timed challenge/i }))

    expect(
      screen.getByText(/enter block data in the mining station first/i),
    ).toBeInTheDocument()
  })

  it('explains the diamond requirement when an upgrade is unaffordable', async () => {
    const user = userEvent.setup()
    render(<App />)

    const upgradeButton = screen.getByRole('button', {
      name: /buy faster pickaxe level 1 for 20 diamonds/i,
    })
    expect(upgradeButton).toBeEnabled()
    await user.click(upgradeButton)

    expect(screen.getByText(/need 20 more diamonds/i)).toBeInTheDocument()
  })

  it('spends diamonds on an upgrade and saves progress locally', async () => {
    const user = userEvent.setup()
    render(<App />)

    for (const data of ['First reward', 'Second reward']) {
      await user.type(screen.getByLabelText(/block data/i), data)
      await user.click(screen.getByRole('button', { name: /start mining/i }))
      await screen.findByText(new RegExp(`${data}`, 'i'))
    }

    await user.click(
      screen.getByRole('button', { name: /buy faster pickaxe level 1 for 20 diamonds/i }),
    )

    expect(screen.getByLabelText(/diamond balance/i)).toHaveTextContent('0')
    expect(screen.getByText(/faster pickaxe.*level 1/i)).toBeInTheDocument()
    expect(window.localStorage.getItem('mini-blockchain-miner:v2')).toContain(
      '"pickaxe":1',
    )
  })

  it('requires confirmation before starting a new game', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/block data/i), 'Saved record')
    await user.click(screen.getByRole('button', { name: /start mining/i }))
    await screen.findByRole('button', { name: /block 1, valid/i })

    await user.click(screen.getByRole('button', { name: /^new game$/i }))
    await user.click(screen.getByRole('button', { name: /keep progress/i }))
    expect(screen.getByRole('button', { name: /block 1, valid/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^new game$/i }))
    await user.click(screen.getByRole('button', { name: /confirm new game/i }))
    expect(screen.queryByRole('button', { name: /block 1/i })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/diamond balance/i)).toHaveTextContent('0')
  })

  it('never starts mining from typing and requires an explicit Auto Miner click', async () => {
    vi.useFakeTimers()
    const saved = createFreshGameState()
    saved.upgrades.autoMiner = 1
    // Older saved games may have left the former automatic toggle enabled.
    saved.autoMineEnabled = true
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    render(<App />)

    fireEvent.change(
      screen.getByLabelText('Block data', { exact: true }),
      { target: { value: 'Automated record' } },
    )
    await act(async () => vi.advanceTimersByTime(2_000))

    expect(mineBlock).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /block 1, valid/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /run auto miner/i }))
    await act(async () => vi.advanceTimersByTime(900))

    expect(screen.getByRole('button', { name: /block 1, valid/i })).toBeInTheDocument()
  })

  it('launches an attacker raid and allows a timed defense repair', async () => {
    const user = userEvent.setup()
    render(<App />)

    for (const data of ['Raid one', 'Raid two']) {
      await user.type(screen.getByLabelText(/block data/i), data)
      await user.click(screen.getByRole('button', { name: /start mining/i }))
      await screen.findByText(data)
    }

    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: /start attacker mode/i }))
    for (let second = 0; second < 5; second += 1) {
      await act(async () => vi.advanceTimersByTime(1_000))
    }

    expect(screen.getByText(/chain broken at block/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /repair chain/i }))
    await act(async () => Promise.resolve())
    expect(screen.getByText(/defense won/i)).toBeInTheDocument()
    expect(screen.getByText(/^chain verified$/i)).toBeInTheDocument()
    expect(screen.getByText(/^idle$/i)).toBeInTheDocument()
  })

  it('locks block editing while a new block is mining', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/block data/i), 'First record')
    await user.click(screen.getByRole('button', { name: /start mining/i }))
    await screen.findByRole('button', { name: /block 1, valid/i })

    mineBlock.mockImplementationOnce(() => new Promise(() => {}))
    await user.type(screen.getByLabelText(/block data/i), 'Second record')
    await user.click(screen.getByRole('button', { name: /start mining/i }))

    expect(screen.getByLabelText(/edit block 1 data/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
    expect(screen.getByText(/chain verified/i)).toBeInTheDocument()
  })
})

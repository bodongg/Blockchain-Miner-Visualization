import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PickaxeAnimation from './PickaxeAnimation'

describe('PickaxeAnimation', () => {
  it('pulls the pickaxe back before swinging into the ore', () => {
    const { container, rerender } = render(
      <PickaxeAnimation
        isMining
        isSuccess={false}
        attempts={250}
        elapsedMs={0}
      />,
    )

    const pickaxe = container.querySelector('.pickaxe')
    expect(pickaxe).toHaveStyle('--pickaxe-progress-angle: -12deg')
    expect(pickaxe).toHaveStyle('--pickaxe-progress-x: 30px')
    expect(pickaxe).toHaveStyle('--pickaxe-progress-y: -28px')

    rerender(
      <PickaxeAnimation
        isMining
        isSuccess={false}
        attempts={750}
        elapsedMs={220}
      />,
    )

    expect(pickaxe).toHaveStyle('--pickaxe-progress-angle: -110deg')
    expect(pickaxe).toHaveStyle('--pickaxe-progress-x: 0px')
    expect(pickaxe).toHaveStyle('--pickaxe-progress-y: 12px')
  })
})

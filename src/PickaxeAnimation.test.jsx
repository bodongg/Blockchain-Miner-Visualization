import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PickaxeAnimation from './PickaxeAnimation'

describe('PickaxeAnimation', () => {
  it('advances a fallback swing frame as mining time progresses', () => {
    const { container, rerender } = render(
      <PickaxeAnimation
        isMining
        isSuccess={false}
        attempts={250}
        elapsedMs={0}
      />,
    )

    const pickaxe = container.querySelector('.pickaxe')
    expect(pickaxe).toHaveStyle('--pickaxe-progress-angle: -10deg')

    rerender(
      <PickaxeAnimation
        isMining
        isSuccess={false}
        attempts={750}
        elapsedMs={240}
      />,
    )

    expect(pickaxe).toHaveStyle('--pickaxe-progress-angle: 36deg')
  })
})

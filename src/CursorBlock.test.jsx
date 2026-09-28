import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CursorBlock from './CursorBlock'

describe('CursorBlock', () => {
  it('does not crash when matchMedia is unavailable', () => {
    const { container } = render(<CursorBlock />)

    expect(container.querySelector('.cursor-block')).toBeInTheDocument()
  })
})

import { useEffect, useRef, useState } from 'react'
import './CursorBlock.css'

export default function CursorBlock() {
  const blockRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (
      typeof window.matchMedia !== 'function' ||
      !window.matchMedia('(pointer: fine)').matches
    ) {
      return undefined
    }

    let frameId = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let hasPosition = false

    function animateBlock() {
      const dx = targetX - currentX
      const dy = targetY - currentY
      currentX += dx * 0.19
      currentY += dy * 0.19

      const element = blockRef.current
      if (element) {
        element.style.transform = `translate3d(${currentX + 12}px, ${currentY + 11}px, 0) translate(-50%, -50%) rotate(${Math.max(-11, Math.min(11, dx * 0.42))}deg)`
      }

      if (Math.abs(dx) > 0.35 || Math.abs(dy) > 0.35) {
        frameId = window.requestAnimationFrame(animateBlock)
      } else {
        frameId = 0
      }
    }

    function handlePointerMove(event) {
      if (event.pointerType === 'touch') return
      targetX = event.clientX
      targetY = event.clientY

      if (!hasPosition) {
        currentX = targetX
        currentY = targetY
        hasPosition = true
      }
      setVisible(true)

      if (!frameId) frameId = window.requestAnimationFrame(animateBlock)
    }

    function handlePointerLeave() {
      hasPosition = false
      setVisible(false)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <span
      ref={blockRef}
      className="cursor-block"
      data-visible={visible}
      aria-hidden="true"
    >
      <span className="cursor-block__cube">
        <span className="cursor-block__top" />
        <span className="cursor-block__front" />
        <span className="cursor-block__side" />
      </span>
    </span>
  )
}

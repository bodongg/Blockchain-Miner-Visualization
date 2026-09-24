function getCrackStage(attempts) {
  if (attempts >= 1000) return 3
  if (attempts >= 100) return 2
  if (attempts >= 10) return 1
  return 0
}

const SWING_POSES = [
  { angle: -12, x: 30, y: -28 },
  { angle: -48, x: 18, y: -10 },
  { angle: -110, x: 0, y: 12 },
  { angle: -58, x: 20, y: -6 },
]

export default function PickaxeAnimation({
  isMining,
  isSuccess,
  attempts,
  elapsedMs = 0,
}) {
  const crackStage = getCrackStage(attempts)
  const swingFrame = isMining
    ? Math.floor(elapsedMs / 110) % SWING_POSES.length
    : -1
  const swingPose = isMining
    ? SWING_POSES[swingFrame]
    : { angle: -16, x: 12, y: -18 }

  return (
    <div
      className={`mining-scene ${isMining ? 'is-mining' : ''} ${
        isSuccess ? 'is-success' : ''
      }`}
      aria-hidden="true"
    >
      <div className="scene-depth scene-depth--back" />
      <div className="ore-glow" />
      <div className={`ore-block crack-stage-${crackStage}`}>
        <span className="ore-vein ore-vein--one" />
        <span className="ore-vein ore-vein--two" />
        <span className="ore-vein ore-vein--three" />
        <span className="crack crack--one" />
        <span className="crack crack--two" />
        <span className="crack crack--three" />
        <span className="fragment fragment--one" />
        <span className="fragment fragment--two" />
        <span className="fragment fragment--three" />
      </div>
      <div
        className="pickaxe"
        style={{
          '--pickaxe-progress-angle': `${swingPose.angle}deg`,
          '--pickaxe-progress-x': `${swingPose.x}px`,
          '--pickaxe-progress-y': `${swingPose.y}px`,
        }}
      >
        <span className="pickaxe__head" />
        <span className="pickaxe__handle" />
      </div>
      <div className="scene-depth scene-depth--front" />
    </div>
  )
}

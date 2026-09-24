function getCrackStage(attempts) {
  if (attempts >= 1000) return 3
  if (attempts >= 100) return 2
  if (attempts >= 10) return 1
  return 0
}

const SWING_ANGLES = [-10, 12, 36, 12]

export default function PickaxeAnimation({
  isMining,
  isSuccess,
  attempts,
  elapsedMs = 0,
}) {
  const crackStage = getCrackStage(attempts)
  const swingFrame = isMining ? Math.floor(elapsedMs / 120) % 4 : 0
  const swingAngle = SWING_ANGLES[swingFrame]

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
        style={{ '--pickaxe-progress-angle': `${swingAngle}deg` }}
      >
        <span className="pickaxe__head" />
        <span className="pickaxe__handle" />
      </div>
      <div className="scene-depth scene-depth--front" />
    </div>
  )
}

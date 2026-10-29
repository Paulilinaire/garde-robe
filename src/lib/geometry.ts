import type { Box } from '../types'

const MIN_SIZE = 0.02

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))

export function clampBox(box: Box): Box {
  const x = Math.min(clamp01(box.x), 1 - MIN_SIZE)
  const y = Math.min(clamp01(box.y), 1 - MIN_SIZE)
  const width = Math.max(MIN_SIZE, Math.min(clamp01(box.width), 1 - x))
  const height = Math.max(MIN_SIZE, Math.min(clamp01(box.height), 1 - y))
  return { x, y, width, height }
}

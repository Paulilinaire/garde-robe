import { describe, expect, it } from 'vitest'
import { clampBox } from './geometry'

describe('clampBox', () => {
  it('keeps a valid box unchanged', () => {
    expect(clampBox({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 })).toEqual({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 })
  })

  it('clips a box overflowing the image', () => {
    const box = clampBox({ x: 0.8, y: 0.9, width: 0.5, height: 0.5 })
    expect(box.x + box.width).toBeCloseTo(1)
    expect(box.y + box.height).toBeCloseTo(1)
  })

  it('handles negative and NaN values', () => {
    const box = clampBox({ x: -0.2, y: Number.NaN, width: 2, height: -1 })
    expect(box.x).toBe(0)
    expect(box.y).toBe(0)
    expect(box.width).toBe(1)
    expect(box.height).toBeGreaterThan(0)
  })
})

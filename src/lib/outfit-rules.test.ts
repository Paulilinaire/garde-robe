import { describe, expect, it } from 'vitest'
import { canComposeOutfit, validateOutfit } from './outfit-rules'

const wardrobe = [
  { id: 'h1', category: 'haut' as const },
  { id: 'h2', category: 'haut' as const },
  { id: 'b1', category: 'bas' as const },
  { id: 'b2', category: 'bas' as const },
  { id: 'r1', category: 'robe' as const },
  { id: 'c1', category: 'chaussures' as const },
  { id: 'v1', category: 'veste' as const },
]

describe('validateOutfit', () => {
  it('accepts top + bottom + shoes', () => {
    expect(validateOutfit(['h1', 'b1', 'c1'], wardrobe)).toEqual({ ok: true })
  })

  it('accepts dress + shoes + jacket', () => {
    expect(validateOutfit(['r1', 'c1', 'v1'], wardrobe)).toEqual({ ok: true })
  })

  it('accepts two layered tops', () => {
    expect(validateOutfit(['h1', 'h2', 'b1', 'c1'], wardrobe)).toEqual({ ok: true })
  })

  it('rejects unknown ids', () => {
    expect(validateOutfit(['h1', 'b1', 'zz'], wardrobe).ok).toBe(false)
  })

  it('rejects duplicates', () => {
    expect(validateOutfit(['h1', 'h1', 'b1', 'c1'], wardrobe).ok).toBe(false)
  })

  it('rejects missing shoes', () => {
    expect(validateOutfit(['h1', 'b1'], wardrobe).ok).toBe(false)
  })

  it('rejects top without bottom', () => {
    expect(validateOutfit(['h1', 'c1'], wardrobe).ok).toBe(false)
  })

  it('rejects two bottoms', () => {
    expect(validateOutfit(['h1', 'b1', 'b2', 'c1'], wardrobe).ok).toBe(false)
  })

  it('rejects dress with bottom', () => {
    expect(validateOutfit(['r1', 'b1', 'c1'], wardrobe).ok).toBe(false)
  })
})

describe('canComposeOutfit', () => {
  it('is false for an empty wardrobe', () => {
    expect(canComposeOutfit([])).toBe(false)
  })

  it('is false without shoes', () => {
    expect(canComposeOutfit(wardrobe.filter((item) => item.category !== 'chaussures'))).toBe(false)
  })

  it('is true with dress and shoes only', () => {
    expect(canComposeOutfit(wardrobe.filter((item) => ['r1', 'c1'].includes(item.id)))).toBe(true)
  })

  it('is false with only a top and shoes', () => {
    expect(canComposeOutfit(wardrobe.filter((item) => ['h1', 'c1'].includes(item.id)))).toBe(false)
  })
})

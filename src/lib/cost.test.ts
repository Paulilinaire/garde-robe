import { describe, expect, it } from 'vitest'
import { estimateCost } from './cost'

describe('estimateCost', () => {
  it('prices one million input and output tokens on Opus 5.5', () => {
    expect(estimateCost('claude-opus-5-5', { input_tokens: 1_000_000, output_tokens: 1_000_000 })).toBeCloseTo(24)
  })

  it('includes cache reads and writes', () => {
    const cost = estimateCost('claude-sonnet-5-5', {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 1_000_000,
      cache_creation_input_tokens: 1_000_000,
    })
    expect(cost).toBeCloseTo(0.2 + 2.5)
  })
})

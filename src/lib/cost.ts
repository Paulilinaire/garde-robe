import type { ModelId } from '../types'

interface Pricing {
  input: number
  output: number
  cacheRead: number
}

const PRICES_PER_MILLION: Record<ModelId, Pricing> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01 },
}

const CACHE_WRITE_MULTIPLIER = 1.25

export interface UsageLike {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
}

export function estimateCost(model: ModelId, usage: UsageLike): number {
  const price = PRICES_PER_MILLION[model]
  const cacheRead = usage.cache_read_input_tokens ?? 0
  const cacheWrite = usage.cache_creation_input_tokens ?? 0
  return (
    (usage.input_tokens * price.input +
      cacheWrite * price.input * CACHE_WRITE_MULTIPLIER +
      cacheRead * price.cacheRead +
      usage.output_tokens * price.output) /
    1_000_000
  )
}

import { describe, expect, it } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import { packBackup, unpackBackup, type Snapshot } from './backup'

const snapshot: Snapshot = {
  items: [
    {
      id: 'a',
      photo: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' }),
      thumb: new Blob([new Uint8Array([4])], { type: 'image/webp' }),
      category: 'haut',
      subtype: 'pull',
      colors: ['camel'],
      material: 'laine',
      pattern: 'uni',
      styles: ['casual'],
      seasons: ['automne'],
      warmth: 4,
      description: 'Pull col roulé camel',
      notes: '',
      createdAt: 1,
      wearCount: 2,
      lastWornAt: null,
    },
  ],
  outfits: [],
  settings: { apiKey: 'sk-secret', model: 'claude-opus-5-5', location: null, spentUsd: 1.5, lastExportAt: null },
  profile: { text: 'Aime le camel', updatedAt: 1, feedbackSinceUpdate: 0 },
  trends: null,
}

describe('backup', () => {
  it('never writes the API key', async () => {
    const bytes = await packBackup(snapshot)
    expect(strFromU8(unzipSync(bytes)['data.json'])).not.toContain('sk-secret')
  })

  it('round-trips data and photos, keeping the current key', async () => {
    const restored = unpackBackup(await packBackup(snapshot), 'sk-current')
    expect(restored.settings.apiKey).toBe('sk-current')
    expect(restored.settings.spentUsd).toBe(1.5)
    expect(restored.profile.text).toBe('Aime le camel')
    expect(restored.items[0].description).toBe('Pull col roulé camel')
    expect(new Uint8Array(await restored.items[0].photo.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('rejects an unrelated zip', async () => {
    const { zipSync } = await import('fflate')
    expect(() => unpackBackup(zipSync({ 'x.txt': new Uint8Array([1]) }), '')).toThrow()
  })
})

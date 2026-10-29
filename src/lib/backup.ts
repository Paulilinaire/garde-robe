import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { Item, Outfit, Settings, StyleProfile, TrendSheet } from '../types'

export interface Snapshot {
  items: Item[]
  outfits: Outfit[]
  settings: Settings
  profile: StyleProfile
  trends: TrendSheet | null
}

const FORMAT_VERSION = 1

type StoredItem = Omit<Item, 'photo' | 'thumb'>

export async function packBackup(snapshot: Snapshot): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {}
  const items: StoredItem[] = []
  for (const { photo, thumb, ...item } of snapshot.items) {
    files[`photos/${item.id}.webp`] = new Uint8Array(await photo.arrayBuffer())
    files[`thumbs/${item.id}.webp`] = new Uint8Array(await thumb.arrayBuffer())
    items.push(item)
  }
  const { apiKey: _apiKey, ...settings } = snapshot.settings
  files['data.json'] = strToU8(
    JSON.stringify({
      version: FORMAT_VERSION,
      items,
      outfits: snapshot.outfits,
      settings,
      profile: snapshot.profile,
      trends: snapshot.trends,
    }),
  )
  return zipSync(files, { level: 0 })
}

export function unpackBackup(bytes: Uint8Array, apiKey: string): Snapshot {
  const files = unzipSync(bytes)
  if (!files['data.json']) throw new Error('Fichier de sauvegarde invalide.')
  const data = JSON.parse(strFromU8(files['data.json']))
  if (data.version !== FORMAT_VERSION) throw new Error('Version de sauvegarde non prise en charge.')
  const webp = (path: string) => {
    const content = files[path]
    if (!content) throw new Error(`Photo manquante dans la sauvegarde : ${path}`)
    return new Blob([content as BlobPart], { type: 'image/webp' })
  }
  return {
    items: (data.items as StoredItem[]).map((item) => ({
      ...item,
      photo: webp(`photos/${item.id}.webp`),
      thumb: webp(`thumbs/${item.id}.webp`),
    })),
    outfits: data.outfits,
    settings: { ...data.settings, apiKey },
    profile: data.profile,
    trends: data.trends,
  }
}

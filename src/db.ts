import Dexie, { type EntityTable } from 'dexie'
import type { Item, Outfit, Settings, StyleProfile, TrendSheet } from './types'

interface KvRow {
  key: string
  value: unknown
}

export const db = new Dexie('garde-robe') as Dexie & {
  items: EntityTable<Item, 'id'>
  outfits: EntityTable<Outfit, 'id'>
  kv: EntityTable<KvRow, 'key'>
}

db.version(1).stores({
  items: 'id, category, createdAt',
  outfits: 'id, createdAt, wornAt',
  kv: 'key',
})

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'claude-opus-5-5',
  location: null,
  spentUsd: 0,
  lastExportAt: null,
}

export const DEFAULT_PROFILE: StyleProfile = {
  text: '',
  updatedAt: 0,
  feedbackSinceUpdate: 0,
}

async function getKv<T>(key: string, fallback: T): Promise<T> {
  const row = await db.kv.get(key)
  return row ? { ...fallback, ...(row.value as T) } : fallback
}

async function patchKv<T>(key: string, fallback: T, patch: Partial<T>): Promise<T> {
  const next = { ...(await getKv(key, fallback)), ...patch }
  await db.kv.put({ key, value: next })
  return next
}

export const getSettings = () => getKv('settings', DEFAULT_SETTINGS)
export const saveSettings = (patch: Partial<Settings>) => patchKv('settings', DEFAULT_SETTINGS, patch)

export const getProfile = () => getKv('profile', DEFAULT_PROFILE)
export const saveProfile = (patch: Partial<StyleProfile>) => patchKv('profile', DEFAULT_PROFILE, patch)

export async function getTrends(): Promise<TrendSheet | null> {
  const row = await db.kv.get('trends')
  return (row?.value as TrendSheet) ?? null
}

export async function saveTrends(sheet: TrendSheet): Promise<void> {
  await db.kv.put({ key: 'trends', value: sheet })
}

export const newId = () => crypto.randomUUID()

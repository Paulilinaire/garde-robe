import { db, getProfile, getSettings, getTrends, saveSettings } from '../db'
import { packBackup, unpackBackup } from './backup'

export async function exportBackup(): Promise<Blob> {
  const bytes = await packBackup({
    items: await db.items.toArray(),
    outfits: await db.outfits.toArray(),
    settings: await getSettings(),
    profile: await getProfile(),
    trends: await getTrends(),
  })
  await saveSettings({ lastExportAt: Date.now() })
  return new Blob([bytes as BlobPart], { type: 'application/zip' })
}

export async function importBackup(file: Blob): Promise<void> {
  const { apiKey } = await getSettings()
  const snapshot = unpackBackup(new Uint8Array(await file.arrayBuffer()), apiKey)
  await db.transaction('rw', db.items, db.outfits, db.kv, async () => {
    await db.items.clear()
    await db.outfits.clear()
    await db.items.bulkPut(snapshot.items)
    await db.outfits.bulkPut(snapshot.outfits)
    await db.kv.put({ key: 'settings', value: snapshot.settings })
    await db.kv.put({ key: 'profile', value: snapshot.profile })
    if (snapshot.trends) await db.kv.put({ key: 'trends', value: snapshot.trends })
  })
}

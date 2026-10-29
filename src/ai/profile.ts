import { db, getProfile, saveProfile } from '../db'
import type { Rating } from '../types'
import { assertNotRefused, getClient, trackUsage } from './client'
import { describeOutfit } from './catalog'

export const FEEDBACK_BATCH = 5
const HISTORY_SIZE = 40

export async function updateStyleProfile(): Promise<string> {
  const { client, model } = await getClient()
  const profile = await getProfile()
  const items = await db.items.toArray()
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const history = (await db.outfits.orderBy('createdAt').reverse().limit(HISTORY_SIZE * 3).toArray())
    .filter((outfit) => outfit.rating || outfit.wornAt)
    .slice(0, HISTORY_SIZE)

  const response = await client.messages.create({
    model,
    max_tokens: 16000,
    output_config: { effort: 'low' },
    system: `Tu tiens à jour le profil de style de Pauline, utilisé ensuite pour lui proposer des tenues.
Écris en français, à la deuxième personne, 120 mots maximum, en puces courtes : ce qu'elle aime, ce qu'elle n'aime pas, ses associations préférées, ses couleurs, ce qu'il faut éviter.
Le profil actuel peut contenir des corrections écrites à la main par Pauline : conserve-les telles quelles, elles priment.
Réponds uniquement avec le profil.`,
    messages: [
      {
        role: 'user',
        content: `## Profil actuel\n${profile.text || '(vide)'}\n\n## Tenues notées ou portées (plus récentes d'abord)\n${
          history.map((outfit) => describeOutfit(outfit, itemsById)).join('\n') || '(aucune)'
        }`,
      },
    ],
  })
  await trackUsage(model, response.usage)
  assertNotRefused(response)
  const text = response.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('')
    .trim()
  if (text) await saveProfile({ text, updatedAt: Date.now(), feedbackSinceUpdate: 0 })
  return text || profile.text
}

export async function recordFeedback(outfitId: string, rating: Rating, reason: string): Promise<void> {
  await db.outfits.update(outfitId, { rating, ratingReason: reason })
  const profile = await getProfile()
  const feedbackSinceUpdate = profile.feedbackSinceUpdate + 1
  await saveProfile({ feedbackSinceUpdate })
  if (feedbackSinceUpdate >= FEEDBACK_BATCH) {
    updateStyleProfile().catch(() => undefined)
  }
}

export async function markWorn(outfitId: string): Promise<void> {
  const outfit = await db.outfits.get(outfitId)
  if (!outfit || outfit.wornAt) return
  const now = Date.now()
  await db.transaction('rw', db.outfits, db.items, async () => {
    await db.outfits.update(outfitId, { wornAt: now })
    for (const id of outfit.itemIds) {
      const item = await db.items.get(id)
      if (item) await db.items.update(id, { wearCount: item.wearCount + 1, lastWornAt: now })
    }
  })
}

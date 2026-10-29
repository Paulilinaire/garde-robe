import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { db, getProfile, getTrends } from '../db'
import { validateOutfit } from '../lib/outfit-rules'
import { MOOD_LABELS, type Item, type Mood, type Weather } from '../types'
import { AiError, assertNotRefused, getClient, trackUsage } from './client'
import { describeItem, describeOutfit } from './catalog'

const OutfitSchema = z.object({
  itemIds: z.array(z.string()),
  explanation: z.string(),
})

const RULES = `Tu es la styliste personnelle de Pauline. Tu composes une tenue complète UNIQUEMENT avec les pièces de sa garde-robe (liste fournie, chaque pièce a un id).
Règles :
- Tenue complète : (un haut + un bas) ou une robe, plus une paire de chaussures. Veste/manteau, sac et accessoires si pertinents. Deux hauts maximum (superposition).
- Respecte la météo : chaleur des pièces, pluie, écart de température dans la journée.
- Respecte l'humeur demandée. « Surprends-moi » = une association inattendue mais portable.
- Son style est éclectique ; elle aime les tendances et les remettre à sa sauce. Inspire-toi de la fiche tendances, adaptée à SES pièces.
- Le profil de style et ses avis passés priment sur les tendances. Ne repropose pas une tenue qu'elle n'a pas aimée.
- Varie : évite les pièces portées ces derniers jours et les tenues déjà proposées aujourd'hui.
- explanation : une ou deux phrases en français, chaleureuses et concrètes, qui disent pourquoi ça marche et ce qui est tendance. Tutoie-la.
- itemIds : uniquement des ids présents dans la liste.`

export interface OutfitRequest {
  mood: Mood
  weather: Weather | null
  anchorItemId?: string
  replace?: { itemIds: string[]; itemId: string }
  alreadyProposed: string[][]
}

export interface OutfitProposal {
  itemIds: string[]
  explanation: string
}

const RECENT_OUTFITS = 30

export async function proposeOutfit(request: OutfitRequest): Promise<OutfitProposal> {
  const { client, model } = await getClient()
  const items = await db.items.orderBy('createdAt').toArray()
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const profile = await getProfile()
  const trends = await getTrends()
  const history = (await db.outfits.orderBy('createdAt').reverse().limit(RECENT_OUTFITS).toArray()).filter(
    (outfit) => outfit.rating || outfit.wornAt,
  )

  const context = [
    `## Garde-robe (${items.length} pièces)`,
    ...items.map(describeItem),
    '',
    '## Profil de style',
    profile.text || '(pas encore de profil, déduis ses goûts de la garde-robe)',
    '',
    '## Fiche tendances',
    trends?.text ?? '(pas de fiche disponible, appuie-toi sur tes connaissances de la saison)',
  ].join('\n')

  const describe = (ids: string[]) => ids.map((id) => itemsById.get(id)?.description ?? id).join(' + ')
  const ask = [
    `Date : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
    `Humeur : ${MOOD_LABELS[request.mood]}`,
    request.weather
      ? `Météo : ${request.weather.label}, ${request.weather.temperature}°C maintenant, ${request.weather.min}°C à ${request.weather.max}°C, risque de pluie ${request.weather.precipitation}%`
      : 'Météo : inconnue',
    '',
    '## Historique récent (avis et tenues portées)',
    history.length ? history.map((outfit) => describeOutfit(outfit, itemsById)).join('\n') : '(aucun)',
    '',
    request.alreadyProposed.length
      ? `## Déjà proposé aujourd'hui (propose autre chose)\n${request.alreadyProposed.map(describe).join('\n')}`
      : '',
    request.anchorItemId ? `Construis la tenue autour de cette pièce : id=${request.anchorItemId} (${describe([request.anchorItemId])}).` : '',
    request.replace
      ? `Garde cette tenue (${request.replace.itemIds.map((id) => `id=${id}`).join(', ')}) mais remplace la pièce id=${request.replace.itemId} (${describe([request.replace.itemId])}) par une autre de la garde-robe qui va mieux ou change l'ambiance.`
      : 'Propose une tenue.',
  ]
    .filter(Boolean)
    .join('\n')

  let correction = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.messages.parse({
      model,
      max_tokens: 16000,
      system: [
        { type: 'text', text: RULES },
        { type: 'text', text: context, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: ask + correction }],
      output_config: { effort: 'medium', format: zodOutputFormat(OutfitSchema) },
    })
    await trackUsage(model, response.usage)
    assertNotRefused(response)
    const proposal = response.parsed_output
    if (!proposal) throw new AiError("Je n'ai pas compris la réponse de l'IA, réessaie.")
    const check = validateOutfit(proposal.itemIds, items)
    if (check.ok) return proposal
    correction = `\n\nTa proposition précédente (${proposal.itemIds.join(', ')}) n'est pas valide : ${check.reason} Corrige-la.`
  }
  throw new AiError("L'IA n'a pas réussi à composer une tenue complète. Réessaie ou ajoute des pièces.")
}

export function itemsOf(ids: string[], items: Item[]): Item[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  return ids.map((id) => byId.get(id)).filter((item): item is Item => Boolean(item))
}

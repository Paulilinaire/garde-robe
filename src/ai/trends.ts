import type Anthropic from '@anthropic-ai/sdk'
import { getTrends, saveTrends } from '../db'
import type { TrendSheet } from '../types'
import { AiError, assertNotRefused, getClient, trackUsage } from './client'

const MAX_CONTINUATIONS = 3

export const currentMonth = () => new Date().toISOString().slice(0, 7)

export async function isTrendSheetStale(): Promise<boolean> {
  const sheet = await getTrends()
  return !sheet || sheet.month !== currentMonth()
}

export async function refreshTrends(): Promise<TrendSheet> {
  const { client, model } = await getClient()
  const tool: Anthropic.Messages.ToolUnion =
    model === 'claude-haiku-5-5'
      ? { type: 'web_search_20250305', name: 'web_search', max_uses: 5 }
      : { type: 'web_search_20260209', name: 'web_search', max_uses: 5 }
  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: 'user',
      content: `Nous sommes en ${monthLabel}. Cherche sur le web les tendances mode de la saison en cours (sources mode françaises et européennes récentes).
Rédige ensuite une fiche concise en français, 250 mots maximum, en puces, avec ces rubriques :
- Couleurs
- Pièces et coupes
- Matières et motifs
- Associations qui font tendance
- Ce qui passe de mode
Réponds uniquement avec la fiche, sans introduction.`,
    },
  ]

  let response: Anthropic.Messages.Message | null = null
  for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
    response = await client.messages.create({ model, max_tokens: 16000, tools: [tool], messages })
    await trackUsage(model, response.usage)
    if (response.stop_reason !== 'pause_turn') break
    messages.push({ role: 'assistant', content: response.content })
  }
  if (!response) throw new AiError('Impossible de récupérer les tendances.')
  assertNotRefused(response)

  const text = response.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()
  if (!text) throw new AiError('La fiche tendances est vide, réessaie.')

  const sources = new Set<string>()
  for (const block of response.content) {
    if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
      for (const result of block.content) sources.add(result.url)
    }
  }

  const sheet: TrendSheet = { text, sources: [...sources].slice(0, 8), month: currentMonth(), createdAt: Date.now() }
  await saveTrends(sheet)
  return sheet
}

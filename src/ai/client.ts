import Anthropic from '@anthropic-ai/sdk'
import { getSettings, saveSettings } from '../db'
import { estimateCost, type UsageLike } from '../lib/cost'
import type { ModelId } from '../types'

export class AiError extends Error {}

export async function getClient(): Promise<{ client: Anthropic; model: ModelId }> {
  const settings = await getSettings()
  if (!settings.apiKey) throw new AiError('Ajoute ta clé API dans les réglages.')
  return {
    client: new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true }),
    model: settings.model,
  }
}

export async function trackUsage(model: ModelId, usage: UsageLike): Promise<void> {
  const settings = await getSettings()
  await saveSettings({ spentUsd: settings.spentUsd + estimateCost(model, usage) })
}

export function assertNotRefused(response: { stop_reason: string | null }): void {
  if (response.stop_reason === 'refusal') throw new AiError("L'IA a refusé de répondre à cette demande.")
  if (response.stop_reason === 'max_tokens') throw new AiError("La réponse de l'IA a été coupée, réessaie.")
}

export function describeError(error: unknown): string {
  if (error instanceof AiError) return error.message
  if (error instanceof Anthropic.AuthenticationError) return 'Clé API invalide. Vérifie-la dans les réglages.'
  if (error instanceof Anthropic.PermissionDeniedError) return "Cette clé API n'a pas accès à ce modèle."
  if (error instanceof Anthropic.RateLimitError) return 'Trop de demandes, réessaie dans une minute.'
  if (error instanceof Anthropic.BadRequestError && /credit/i.test(error.message)) {
    return 'Crédits API épuisés. Recharge-les sur la console Anthropic.'
  }
  if (error instanceof Anthropic.APIConnectionError) return 'Pas de connexion internet.'
  if (error instanceof Anthropic.APIError) return `Erreur de l'IA (${error.status}).`
  if (error instanceof Error) return error.message
  return 'Erreur inconnue.'
}

import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { blobToBase64, resizeToWebp } from '../lib/image'
import { clampBox } from '../lib/geometry'
import { CATEGORIES, SEASONS, type DetectedItem } from '../types'
import { AiError, assertNotRefused, getClient, trackUsage } from './client'

const ANALYSIS_MAX_SIDE = 1568

const DetectionSchema = z.object({
  items: z.array(
    z.object({
      category: z.enum(CATEGORIES),
      subtype: z.string(),
      colors: z.array(z.string()),
      material: z.string(),
      pattern: z.string(),
      styles: z.array(z.string()),
      seasons: z.array(z.enum(SEASONS)),
      warmth: z.number(),
      description: z.string(),
      box: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }),
    }),
  ),
})

const SYSTEM = `Tu catalogues les vêtements d'une garde-robe personnelle à partir de photos.
Pour chaque vêtement, chaussure, sac ou accessoire visible en entier ou presque, renvoie :
- category : haut (t-shirt, chemise, pull, gilet…), bas (pantalon, jean, jupe, short), robe (robe, combinaison), veste (veste, manteau, blazer, trench), chaussures, sac, accessoire (ceinture, foulard, bijou, chapeau…)
- subtype : le type précis en français (« pull col roulé », « jean droit »…)
- colors : couleurs principales en français, la dominante en premier
- material : matière probable en français
- pattern : « uni », « rayé », « à fleurs », etc.
- styles : 1 à 3 parmi casual, élégant, fun, sport, bohème, rock, classique, minimaliste, romantique
- seasons : saisons où la pièce se porte (printemps, ete, automne, hiver)
- warmth : chaleur de 1 (très léger) à 5 (très chaud)
- description : 3 à 6 mots qui permettent de reconnaître la pièce (« pull col roulé camel »)
- box : rectangle englobant la pièce, en fractions de l'image (x, y = coin haut-gauche ; width, height), de 0 à 1, avec une petite marge
Ignore les personnes, les meubles et le décor. Si l'image est une capture d'écran de boutique, ne garde que les articles mis en avant.
Si aucun vêtement n'est visible, renvoie une liste vide.`

export async function analyzePhoto(photo: Blob): Promise<DetectedItem[]> {
  const { client, model } = await getClient()
  const image = await resizeToWebp(photo, ANALYSIS_MAX_SIDE)
  const response = await client.messages.parse({
    model,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/webp', data: await blobToBase64(image) } },
          { type: 'text', text: 'Catalogue les pièces de cette photo.' },
        ],
      },
    ],
    output_config: { effort: 'medium', format: zodOutputFormat(DetectionSchema) },
  })
  await trackUsage(model, response.usage)
  assertNotRefused(response)
  if (!response.parsed_output) throw new AiError("Je n'ai pas compris la réponse de l'IA, réessaie.")
  return response.parsed_output.items.map((item) => ({
    ...item,
    warmth: Math.min(5, Math.max(1, Math.round(item.warmth))),
    box: clampBox(item.box),
  }))
}

import type { Category, Item } from '../types'

const MAX_PER_CATEGORY: Record<Category, number> = {
  haut: 2,
  bas: 1,
  robe: 1,
  veste: 1,
  chaussures: 1,
  sac: 1,
  accessoire: 3,
}

type CategorizedItem = Pick<Item, 'id' | 'category'>

export function canComposeOutfit(items: CategorizedItem[]): boolean {
  const has = (category: Category) => items.some((item) => item.category === category)
  return has('chaussures') && (has('robe') || (has('haut') && has('bas')))
}

export function validateOutfit(
  itemIds: string[],
  items: CategorizedItem[],
): { ok: true } | { ok: false; reason: string } {
  const byId = new Map(items.map((item) => [item.id, item]))
  if (new Set(itemIds).size !== itemIds.length) {
    return { ok: false, reason: 'La même pièce apparaît deux fois.' }
  }
  const unknown = itemIds.filter((id) => !byId.has(id))
  if (unknown.length > 0) {
    return { ok: false, reason: `Identifiants inconnus : ${unknown.join(', ')}.` }
  }
  const counts = new Map<Category, number>()
  for (const id of itemIds) {
    const category = byId.get(id)!.category
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }
  for (const [category, count] of counts) {
    if (count > MAX_PER_CATEGORY[category]) {
      return { ok: false, reason: `Trop de pièces de type « ${category} ».` }
    }
  }
  const count = (category: Category) => counts.get(category) ?? 0
  if (count('robe') > 0 && count('bas') > 0) {
    return { ok: false, reason: 'Une robe et un bas ensemble.' }
  }
  if (!count('chaussures')) {
    return { ok: false, reason: 'Il manque des chaussures.' }
  }
  if (!count('robe') && !(count('haut') && count('bas'))) {
    return { ok: false, reason: 'Il manque un haut et un bas, ou une robe.' }
  }
  return { ok: true }
}

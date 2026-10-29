import type { Item, Outfit } from '../types'

const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('fr-FR')

export function describeItem(item: Item): string {
  const worn = item.wearCount
    ? `porté ${item.wearCount} fois${item.lastWornAt ? `, dernier port ${formatDate(item.lastWornAt)}` : ''}`
    : 'jamais porté'
  return [
    `id=${item.id}`,
    item.category,
    item.description,
    `couleurs: ${item.colors.join(', ')}`,
    `matière: ${item.material}`,
    `motif: ${item.pattern}`,
    `styles: ${item.styles.join(', ')}`,
    `saisons: ${item.seasons.join(', ')}`,
    `chaleur: ${item.warmth}/5`,
    item.notes ? `note: ${item.notes}` : '',
    worn,
  ]
    .filter(Boolean)
    .join(' | ')
}

export function describeOutfit(outfit: Outfit, itemsById: Map<string, Item>): string {
  const pieces = outfit.itemIds.map((id) => itemsById.get(id)?.description ?? '(pièce supprimée)').join(' + ')
  const verdict =
    outfit.rating === 'like' ? '👍 aimée' : outfit.rating === 'dislike' ? '👎 pas aimée' : 'sans avis'
  return `${formatDate(outfit.createdAt)} [${outfit.mood}] ${pieces} — ${verdict}${
    outfit.ratingReason ? ` (« ${outfit.ratingReason} »)` : ''
  }${outfit.wornAt ? ' — portée' : ''}`
}

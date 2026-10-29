export const CATEGORIES = ['haut', 'bas', 'robe', 'veste', 'chaussures', 'sac', 'accessoire'] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  haut: 'Haut',
  bas: 'Bas',
  robe: 'Robe / combinaison',
  veste: 'Veste / manteau',
  chaussures: 'Chaussures',
  sac: 'Sac',
  accessoire: 'Accessoire',
}

export const MOODS = ['casual', 'elegant', 'fun', 'surprise'] as const
export type Mood = (typeof MOODS)[number]

export const MOOD_LABELS: Record<Mood, string> = {
  casual: 'Casual',
  elegant: 'Élégant',
  fun: 'Fun',
  surprise: 'Surprends-moi',
}

export const SEASONS = ['printemps', 'ete', 'automne', 'hiver'] as const
export type Season = (typeof SEASONS)[number]

export interface ItemAttributes {
  category: Category
  subtype: string
  colors: string[]
  material: string
  pattern: string
  styles: string[]
  seasons: Season[]
  warmth: number
  description: string
}

export interface Item extends ItemAttributes {
  id: string
  photo: Blob
  thumb: Blob
  notes: string
  createdAt: number
  wearCount: number
  lastWornAt: number | null
}

export interface Weather {
  temperature: number
  min: number
  max: number
  precipitation: number
  label: string
}

export type Rating = 'like' | 'dislike'

export interface Outfit {
  id: string
  itemIds: string[]
  mood: Mood
  weather: Weather | null
  explanation: string
  createdAt: number
  rating: Rating | null
  ratingReason: string
  wornAt: number | null
}

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Opus 5.5 — le meilleur' },
  { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5 — équilibré' },
  { id: 'claude-haiku-5-5', label: 'Haiku 5.5 — économique' },
] as const
export type ModelId = (typeof MODELS)[number]['id']

export interface Location {
  latitude: number
  longitude: number
  name: string
}

export interface Settings {
  apiKey: string
  model: ModelId
  location: Location | null
  spentUsd: number
  lastExportAt: number | null
}

export interface StyleProfile {
  text: string
  updatedAt: number
  feedbackSinceUpdate: number
}

export interface TrendSheet {
  text: string
  sources: string[]
  month: string
  createdAt: number
}

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface DetectedItem extends ItemAttributes {
  box: Box
}

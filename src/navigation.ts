export type View =
  | { name: 'today'; anchorItemId?: string }
  | { name: 'wardrobe' }
  | { name: 'item'; id: string }
  | { name: 'add' }
  | { name: 'history' }
  | { name: 'more' }
  | { name: 'trends' }
  | { name: 'style' }
  | { name: 'settings' }

export type Navigate = (view: View) => void

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Thumb } from '../components/Thumb'
import { CATEGORIES, CATEGORY_LABELS, type Category } from '../types'
import type { Navigate } from '../navigation'

export function Wardrobe({ navigate }: { navigate: Navigate }) {
  const items = useLiveQuery(() => db.items.orderBy('createdAt').reverse().toArray(), [])
  const [category, setCategory] = useState<Category | null>(null)
  const [search, setSearch] = useState('')

  if (!items) return null
  const needle = search.trim().toLowerCase()
  const visible = items.filter(
    (item) =>
      (!category || item.category === category) &&
      (!needle || `${item.description} ${item.colors.join(' ')} ${item.subtype}`.toLowerCase().includes(needle)),
  )

  return (
    <section>
      <h1>Ma garde-robe <span className="muted">({items.length})</span></h1>
      <input placeholder="Rechercher (couleur, type…)" value={search} onChange={(event) => setSearch(event.target.value)} />
      <div className="moods scroll">
        <button type="button" className={`chip${category ? '' : ' active'}`} onClick={() => setCategory(null)}>
          Tout
        </button>
        {CATEGORIES.map((option) => (
          <button key={option} type="button" className={`chip${category === option ? ' active' : ''}`} onClick={() => setCategory(option)}>
            {CATEGORY_LABELS[option]}
          </button>
        ))}
      </div>
      {items.length === 0 && (
        <p className="muted center">
          Ta garde-robe est vide.{' '}
          <button type="button" className="link" onClick={() => navigate({ name: 'add' })}>
            Ajoute tes premières pièces
          </button>
        </p>
      )}
      <div className="grid">
        {visible.map((item) => (
          <button key={item.id} type="button" className="grid-tile" onClick={() => navigate({ name: 'item', id: item.id })}>
            <Thumb blob={item.thumb} alt={item.description} />
            <span>{item.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

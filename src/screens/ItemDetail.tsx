import { useEffect, useState } from 'react'
import { db } from '../db'
import { Thumb } from '../components/Thumb'
import { CategoryAndDescription, ItemDetailsFields } from '../components/ItemFields'
import type { Item } from '../types'
import type { Navigate } from '../navigation'

export function ItemDetail({ id, navigate }: { id: string; navigate: Navigate }) {
  const [item, setItem] = useState<Item | null>(null)
  const [dirty, setDirty] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    db.items.get(id).then((found) => setItem(found ?? null))
  }, [id])

  if (!item) return null

  const change = (next: Item) => {
    setItem(next)
    setDirty(true)
  }

  const save = async () => {
    await db.items.put(item)
    setDirty(false)
  }

  const remove = async () => {
    await db.items.delete(item.id)
    navigate({ name: 'wardrobe' })
  }

  return (
    <section className="stack">
      <button type="button" className="link back" onClick={() => navigate({ name: 'wardrobe' })}>
        ← Garde-robe
      </button>
      <Thumb blob={item.photo} alt={item.description} className="detail-photo" />
      <button type="button" className="primary" onClick={() => navigate({ name: 'today', anchorItemId: item.id })}>
        ✨ Compose une tenue avec
      </button>
      <p className="muted small">
        Portée {item.wearCount} fois{item.lastWornAt ? `, la dernière le ${new Date(item.lastWornAt).toLocaleDateString('fr-FR')}` : ''}
      </p>
      <CategoryAndDescription value={item} onChange={change} />
      <ItemDetailsFields value={item} onChange={change} />
      <label>
        Notes pour l'IA
        <textarea rows={2} placeholder="Ex. : un peu court, à porter avec des talons" value={item.notes} onChange={(event) => change({ ...item, notes: event.target.value })} />
      </label>
      {dirty && (
        <button type="button" className="primary" onClick={save}>
          Enregistrer
        </button>
      )}
      {confirmDelete ? (
        <div className="row">
          <button type="button" className="danger" onClick={remove}>
            Oui, supprimer
          </button>
          <button type="button" onClick={() => setConfirmDelete(false)}>
            Annuler
          </button>
        </div>
      ) : (
        <button type="button" className="danger-outline" onClick={() => setConfirmDelete(true)}>
          Supprimer cette pièce
        </button>
      )}
    </section>
  )
}

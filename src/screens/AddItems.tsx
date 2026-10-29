import { useEffect, useState } from 'react'
import { analyzePhoto } from '../ai/analyze'
import { describeError } from '../ai/client'
import { db, newId } from '../db'
import { useObjectUrl } from '../hooks'
import { clampBox } from '../lib/geometry'
import { cropToWebp, PHOTO_MAX_SIDE, THUMB_MAX_SIDE } from '../lib/image'
import { CropPreview } from '../components/CropPreview'
import { CategoryAndDescription, ItemDetailsFields } from '../components/ItemFields'
import type { Box, DetectedItem } from '../types'
import type { Navigate } from '../navigation'

interface Draft extends DetectedItem {
  key: string
  keep: boolean
}

const BOX_FIELDS: { field: keyof Box; label: string }[] = [
  { field: 'x', label: 'Gauche' },
  { field: 'y', label: 'Haut' },
  { field: 'width', label: 'Largeur' },
  { field: 'height', label: 'Hauteur' },
]

export function AddItems({ navigate }: { navigate: Navigate }) {
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [ratio, setRatio] = useState(1)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(0)
  const url = useObjectUrl(photo)

  useEffect(() => {
    if (!url) return
    const image = new Image()
    image.onload = () => setRatio(image.naturalWidth / image.naturalHeight)
    image.src = url
  }, [url])

  const pick = async (file: File | undefined) => {
    if (!file) return
    setPhoto(file)
    setDrafts([])
    setSaved(0)
    setError('')
    setStatus("J'analyse ta photo…")
    try {
      const detected = await analyzePhoto(file)
      setDrafts(detected.map((item) => ({ ...item, key: newId(), keep: true })))
      if (!detected.length) setError("Je n'ai trouvé aucun vêtement sur cette photo.")
    } catch (caught) {
      setError(describeError(caught))
    } finally {
      setStatus('')
    }
  }

  const update = (key: string, next: Draft) => setDrafts((current) => current.map((draft) => (draft.key === key ? next : draft)))

  const save = async () => {
    if (!photo) return
    const kept = drafts.filter((draft) => draft.keep)
    setStatus('Enregistrement…')
    try {
      for (const { key: _key, keep: _keep, box, ...attributes } of kept) {
        await db.items.add({
          ...attributes,
          id: newId(),
          photo: await cropToWebp(photo, box, PHOTO_MAX_SIDE),
          thumb: await cropToWebp(photo, box, THUMB_MAX_SIDE),
          notes: '',
          createdAt: Date.now(),
          wearCount: 0,
          lastWornAt: null,
        })
      }
      setSaved(kept.length)
      setPhoto(null)
      setDrafts([])
    } catch (caught) {
      setError(describeError(caught))
    } finally {
      setStatus('')
    }
  }

  const keptCount = drafts.filter((draft) => draft.keep).length

  return (
    <section>
      <h1>Ajouter des vêtements</h1>
      {!photo && (
        <>
          <p className="muted">Étale plusieurs pièces sur un lit ou le sol, bien séparées, et prends-les en photo d'un coup. Ça marche aussi avec une capture d'écran de commande en ligne.</p>
          {saved > 0 && (
            <p className="success">
              ✅ {saved} pièce{saved > 1 ? 's' : ''} ajoutée{saved > 1 ? 's' : ''} !{' '}
              <button type="button" className="link" onClick={() => navigate({ name: 'wardrobe' })}>
                Voir ma garde-robe
              </button>
            </p>
          )}
          <div className="stack">
            <label className="button primary">
              📷 Prendre une photo
              <input type="file" accept="image/*" capture="environment" hidden onChange={(event) => pick(event.target.files?.[0])} />
            </label>
            <label className="button">
              🖼️ Choisir dans la galerie
              <input type="file" accept="image/*" hidden onChange={(event) => pick(event.target.files?.[0])} />
            </label>
          </div>
        </>
      )}

      {url && <img src={url} alt="" className="source-photo" />}
      {status && <p className="status">⏳ {status}</p>}
      {error && <p className="error">{error}</p>}

      {url &&
        drafts.map((draft) => (
          <article key={draft.key} className={`card draft${draft.keep ? '' : ' discarded'}`}>
            <div className="draft-head">
              <CropPreview url={url} box={draft.box} naturalRatio={ratio} />
              <div className="stack grow">
                <CategoryAndDescription value={draft} onChange={(next) => update(draft.key, next)} />
                <label className="checkbox">
                  <input type="checkbox" checked={draft.keep} onChange={(event) => update(draft.key, { ...draft, keep: event.target.checked })} />
                  Garder
                </label>
              </div>
            </div>
            <details>
              <summary>Recadrer</summary>
              {BOX_FIELDS.map(({ field, label }) => (
                <label key={field}>
                  {label}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(draft.box[field] * 100)}
                    onChange={(event) =>
                      update(draft.key, { ...draft, box: clampBox({ ...draft.box, [field]: Number(event.target.value) / 100 }) })
                    }
                  />
                </label>
              ))}
            </details>
            <details>
              <summary>Détails</summary>
              <ItemDetailsFields value={draft} onChange={(next) => update(draft.key, next)} />
            </details>
          </article>
        ))}

      {photo && !status && (
        <div className="actions sticky">
          <button type="button" onClick={() => { setPhoto(null); setDrafts([]) }}>
            Annuler
          </button>
          {keptCount > 0 && (
            <button type="button" className="primary" onClick={save}>
              Ajouter {keptCount} pièce{keptCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

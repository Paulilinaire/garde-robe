import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings, newId } from '../db'
import { describeError } from '../ai/client'
import { itemsOf, proposeOutfit } from '../ai/outfit'
import { isTrendSheetStale, refreshTrends } from '../ai/trends'
import { markWorn, recordFeedback } from '../ai/profile'
import { canComposeOutfit } from '../lib/outfit-rules'
import { getWeather, weatherIcon } from '../lib/weather'
import { OutfitBoard } from '../components/OutfitBoard'
import { MOOD_LABELS, MOODS, type Item, type Mood, type Outfit, type Weather } from '../types'
import type { Navigate } from '../navigation'

const DISLIKE_REASONS = ['Trop sage', 'Pas mes couleurs', 'Pas confortable', 'Pas adapté à la météo', 'Pas mon style']
const EXPORT_REMINDER_MS = 30 * 24 * 3600 * 1000

const startOfToday = () => new Date().setHours(0, 0, 0, 0)

export function Today({ anchorItemId, navigate }: { anchorItemId?: string; navigate: Navigate }) {
  const items = useLiveQuery(() => db.items.toArray(), [])
  const settings = useLiveQuery(() => getSettings(), [])
  const [weather, setWeather] = useState<Weather | null>(null)
  const [mood, setMood] = useState<Mood | null>(null)
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [swapping, setSwapping] = useState(false)
  const [dislikeOpen, setDislikeOpen] = useState(false)
  const [reason, setReason] = useState('')

  const anchor = items?.find((item) => item.id === anchorItemId)

  useEffect(() => {
    getSettings().then((current) => {
      if (current.location) getWeather(current.location).then(setWeather).catch(() => setWeather(null))
    })
  }, [])

  useEffect(() => {
    db.outfits
      .where('createdAt')
      .aboveOrEqual(startOfToday())
      .reverse()
      .first()
      .then((latest) => {
        if (latest && !anchorItemId) {
          setOutfit(latest)
          setMood(latest.mood)
        }
      })
  }, [anchorItemId])

  if (!items || !settings) return null

  if (!canComposeOutfit(items)) {
    return (
      <section className="empty">
        <h1>Ta tenue du jour</h1>
        <p>Pour composer une tenue, il me faut au moins des chaussures et un haut + un bas (ou une robe).</p>
        <button type="button" className="primary" onClick={() => navigate({ name: 'add' })}>
          Ajouter des vêtements
        </button>
      </section>
    )
  }

  const generate = async (chosenMood: Mood, replaceItemId?: string) => {
    setError('')
    setSwapping(false)
    setDislikeOpen(false)
    try {
      if (await isTrendSheetStale()) {
        setStatus('Je regarde les tendances du mois…')
        await refreshTrends().catch(() => undefined)
      }
      setStatus(replaceItemId ? 'Je cherche une autre pièce…' : 'Je compose ta tenue…')
      const today = await db.outfits.where('createdAt').aboveOrEqual(startOfToday()).toArray()
      const proposal = await proposeOutfit({
        mood: chosenMood,
        weather,
        anchorItemId: replaceItemId ? undefined : anchorItemId,
        replace: replaceItemId && outfit ? { itemIds: outfit.itemIds, itemId: replaceItemId } : undefined,
        alreadyProposed: today.map((proposed) => proposed.itemIds),
      })
      const created: Outfit = {
        id: newId(),
        itemIds: proposal.itemIds,
        mood: chosenMood,
        weather,
        explanation: proposal.explanation,
        createdAt: Date.now(),
        rating: null,
        ratingReason: '',
        wornAt: null,
      }
      await db.outfits.add(created)
      setOutfit(created)
    } catch (caught) {
      setError(describeError(caught))
    } finally {
      setStatus('')
    }
  }

  const chooseMood = (chosen: Mood) => {
    setMood(chosen)
    generate(chosen)
  }

  const rate = async (rating: 'like' | 'dislike', why = '') => {
    if (!outfit) return
    await recordFeedback(outfit.id, rating, why)
    setOutfit({ ...outfit, rating, ratingReason: why })
    setDislikeOpen(false)
    setReason('')
  }

  const wear = async () => {
    if (!outfit) return
    await markWorn(outfit.id)
    setOutfit({ ...outfit, wornAt: Date.now() })
  }

  const swap = (item: Item) => {
    if (mood) generate(mood, item.id)
  }

  const showExportReminder = items.length > 0 && Date.now() - (settings.lastExportAt ?? 0) > EXPORT_REMINDER_MS

  return (
    <section>
      <header className="today-header">
        <h1>Ta tenue du jour</h1>
        {weather && (
          <p className="muted">
            {weatherIcon(weather.label)} {weather.temperature}°C · {weather.min}° / {weather.max}° · {settings.location?.name}
          </p>
        )}
      </header>

      {showExportReminder && (
        <button type="button" className="banner" onClick={() => navigate({ name: 'settings' })}>
          💾 Pense à sauvegarder ta garde-robe (Réglages → Exporter)
        </button>
      )}

      {anchor && <p className="anchor">Autour de : <strong>{anchor.description}</strong></p>}

      <div className="moods">
        {MOODS.map((option) => (
          <button
            key={option}
            type="button"
            className={`chip${mood === option ? ' active' : ''}`}
            disabled={Boolean(status)}
            onClick={() => chooseMood(option)}
          >
            {MOOD_LABELS[option]}
          </button>
        ))}
      </div>

      {!mood && !status && <p className="muted center">Choisis ton humeur du jour ☝️</p>}
      {status && <p className="status">⏳ {status}</p>}
      {error && <p className="error">{error}</p>}

      {outfit && !status && (
        <>
          {swapping && <p className="muted center">Touche la pièce à remplacer</p>}
          <OutfitBoard items={itemsOf(outfit.itemIds, items)} onPick={swapping ? swap : undefined} highlight={swapping} />
          <div className="why">
            ✨ <strong>Pourquoi ça marche :</strong> {outfit.explanation}
          </div>

          <div className="actions">
            <button type="button" onClick={() => mood && generate(mood)}>
              🔄 Une autre
            </button>
            <button type="button" className={swapping ? 'active' : ''} onClick={() => setSwapping(!swapping)}>
              ✏️ Changer une pièce
            </button>
            <button type="button" className="primary" disabled={Boolean(outfit.wornAt)} onClick={wear}>
              {outfit.wornAt ? '✅ Portée' : '✅ Je la porte'}
            </button>
          </div>

          <div className="rating">
            <button type="button" className={outfit.rating === 'like' ? 'active' : ''} onClick={() => rate('like')}>
              👍 J'aime
            </button>
            <button
              type="button"
              className={outfit.rating === 'dislike' ? 'active' : ''}
              onClick={() => setDislikeOpen(!dislikeOpen)}
            >
              👎 Bof
            </button>
          </div>

          {dislikeOpen && (
            <div className="card stack">
              <p className="small">Pourquoi ? (ça m'aide à apprendre tes goûts)</p>
              <div className="moods">
                {DISLIKE_REASONS.map((option) => (
                  <button key={option} type="button" className="chip" onClick={() => rate('dislike', option)}>
                    {option}
                  </button>
                ))}
              </div>
              <div className="row">
                <input placeholder="Autre raison…" value={reason} onChange={(event) => setReason(event.target.value)} />
                <button type="button" disabled={!reason.trim()} onClick={() => rate('dislike', reason.trim())}>
                  OK
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

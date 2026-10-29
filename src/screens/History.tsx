import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { itemsOf } from '../ai/outfit'
import { Thumb } from '../components/Thumb'
import { MOOD_LABELS } from '../types'

const LIMIT = 60

export function History() {
  const data = useLiveQuery(async () => {
    const outfits = await db.outfits.orderBy('createdAt').reverse().limit(LIMIT * 4).toArray()
    return {
      outfits: outfits.filter((outfit) => outfit.wornAt || outfit.rating).slice(0, LIMIT),
      items: await db.items.toArray(),
    }
  }, [])

  if (!data) return null

  return (
    <section>
      <h1>Historique</h1>
      {data.outfits.length === 0 && <p className="muted center">Les tenues portées ou notées apparaîtront ici.</p>}
      {data.outfits.map((outfit) => (
        <article key={outfit.id} className="card history">
          <p className="small">
            {new Date(outfit.createdAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
            {MOOD_LABELS[outfit.mood]} {outfit.wornAt ? '· ✅ portée' : ''} {outfit.rating === 'like' ? '· 👍' : ''}
            {outfit.rating === 'dislike' ? `· 👎 ${outfit.ratingReason}` : ''}
          </p>
          <div className="history-thumbs">
            {itemsOf(outfit.itemIds, data.items).map((item) => (
              <Thumb key={item.id} blob={item.thumb} alt={item.description} />
            ))}
          </div>
        </article>
      ))}
    </section>
  )
}

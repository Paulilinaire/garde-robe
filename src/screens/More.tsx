import type { Navigate } from '../navigation'

export function More({ navigate }: { navigate: Navigate }) {
  return (
    <section className="stack">
      <h1>Plus</h1>
      <button type="button" className="menu-item" onClick={() => navigate({ name: 'trends' })}>
        🔥 Tendances du mois
      </button>
      <button type="button" className="menu-item" onClick={() => navigate({ name: 'style' })}>
        💃 Mon style
      </button>
      <button type="button" className="menu-item" onClick={() => navigate({ name: 'settings' })}>
        ⚙️ Réglages et sauvegarde
      </button>
    </section>
  )
}

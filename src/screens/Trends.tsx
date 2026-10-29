import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getTrends } from '../db'
import { describeError } from '../ai/client'
import { refreshTrends } from '../ai/trends'

export function Trends() {
  const sheet = useLiveQuery(() => getTrends(), [])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const refresh = async () => {
    setError('')
    setStatus('Je parcours les tendances du moment…')
    try {
      await refreshTrends()
    } catch (caught) {
      setError(describeError(caught))
    } finally {
      setStatus('')
    }
  }

  return (
    <section className="stack">
      <h1>Tendances du mois</h1>
      {sheet ? (
        <>
          <p className="muted small">Mise à jour le {new Date(sheet.createdAt).toLocaleDateString('fr-FR')}</p>
          <div className="card prose">{sheet.text}</div>
          {sheet.sources.length > 0 && (
            <details>
              <summary>Sources</summary>
              <ul className="sources">
                {sheet.sources.map((source) => (
                  <li key={source}>
                    <a href={source} target="_blank" rel="noreferrer">
                      {new URL(source).hostname}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      ) : (
        <p className="muted">Pas encore de fiche. Elle se crée automatiquement à ta première tenue du mois.</p>
      )}
      {status && <p className="status">⏳ {status}</p>}
      {error && <p className="error">{error}</p>}
      <button type="button" disabled={Boolean(status)} onClick={refresh}>
        🔄 Rafraîchir
      </button>
    </section>
  )
}

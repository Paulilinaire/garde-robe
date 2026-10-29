import { useEffect, useState } from 'react'
import { getProfile, saveProfile } from '../db'
import { describeError } from '../ai/client'
import { FEEDBACK_BATCH, updateStyleProfile } from '../ai/profile'
import type { StyleProfile } from '../types'

export function StyleProfileScreen() {
  const [profile, setProfile] = useState<StyleProfile | null>(null)
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const load = () =>
    getProfile().then((current) => {
      setProfile(current)
      setText(current.text)
    })

  useEffect(() => {
    load()
  }, [])

  if (!profile) return null

  const save = async () => {
    await saveProfile({ text: text.trim(), updatedAt: Date.now() })
    await load()
  }

  const relearn = async () => {
    setError('')
    setStatus("Je relis tes avis…")
    try {
      await updateStyleProfile()
      await load()
    } catch (caught) {
      setError(describeError(caught))
    } finally {
      setStatus('')
    }
  }

  return (
    <section className="stack">
      <h1>Mon style</h1>
      <p className="muted small">
        Ce profil guide chaque proposition. Il se met à jour tous les {FEEDBACK_BATCH} avis 👍/👎. Tu peux le corriger à la main : tes corrections priment.
      </p>
      <textarea rows={12} value={text} onChange={(event) => setText(event.target.value)} placeholder="Pas encore de profil : note quelques tenues pour que je l'écrive." />
      {text !== profile.text && (
        <button type="button" className="primary" onClick={save}>
          Enregistrer
        </button>
      )}
      {status && <p className="status">⏳ {status}</p>}
      {error && <p className="error">{error}</p>}
      <button type="button" disabled={Boolean(status)} onClick={relearn}>
        🧠 Mettre à jour depuis mes avis
      </button>
    </section>
  )
}

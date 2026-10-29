import { useState } from 'react'
import { saveProfile, saveSettings } from '../db'
import { LocationPicker } from './LocationPicker'
import type { Location } from '../types'

export function Onboarding() {
  const [apiKey, setApiKey] = useState('')
  const [location, setLocation] = useState<Location | null>(null)
  const [style, setStyle] = useState('')

  const start = async () => {
    if (style.trim()) await saveProfile({ text: style.trim(), updatedAt: Date.now() })
    await saveSettings({ apiKey: apiKey.trim(), location })
  }

  return (
    <main className="screen onboarding">
      <h1>Bienvenue 👋</h1>
      <p className="muted">Ta garde-robe reste sur ton téléphone. Seules les descriptions sont envoyées à l'IA pour composer tes tenues.</p>

      <section className="card">
        <h2>1. Ta clé API Anthropic</h2>
        <p className="muted small">
          Crée-la sur{' '}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
            la console Anthropic
          </a>{' '}
          (rubrique API Keys) après avoir acheté quelques crédits. Elle reste stockée uniquement sur ce téléphone.
        </p>
        <input type="password" placeholder="sk-ant-…" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" />
      </section>

      <section className="card">
        <h2>2. Ta ville, pour la météo</h2>
        <LocationPicker value={location} onChange={setLocation} />
      </section>

      <section className="card">
        <h2>3. Ton style en quelques mots (facultatif)</h2>
        <textarea
          rows={3}
          placeholder="Ex. : éclectique, casual en semaine, j'adore les touches de couleur, jamais de talons…"
          value={style}
          onChange={(event) => setStyle(event.target.value)}
        />
      </section>

      <button type="button" className="primary" disabled={!apiKey.trim().startsWith('sk-')} onClick={start}>
        C'est parti
      </button>
    </main>
  )
}

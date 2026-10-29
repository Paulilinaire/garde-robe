import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings, saveSettings } from '../db'
import { exportBackup, importBackup } from '../lib/backup-db'
import { LocationPicker } from './LocationPicker'
import { MODELS, type ModelId } from '../types'

export function SettingsScreen() {
  const settings = useLiveQuery(() => getSettings(), [])
  const [apiKey, setApiKey] = useState('')
  const [message, setMessage] = useState('')
  const [confirmImport, setConfirmImport] = useState<File | null>(null)

  if (!settings) return null

  const download = async () => {
    const blob = await exportBackup()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `garde-robe-${new Date().toISOString().slice(0, 10)}.zip`
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 10000)
    setMessage('Sauvegarde téléchargée ✅')
  }

  const restore = async () => {
    if (!confirmImport) return
    try {
      await importBackup(confirmImport)
      setMessage('Sauvegarde restaurée ✅')
    } catch (error) {
      setMessage((error as Error).message)
    } finally {
      setConfirmImport(null)
    }
  }

  return (
    <section className="stack">
      <h1>Réglages</h1>

      <div className="card stack">
        <h2>Modèle IA</h2>
        <select value={settings.model} onChange={(event) => saveSettings({ model: event.target.value as ModelId })}>
          {MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </select>
        <p className="muted small">Dépense estimée depuis l'installation : {settings.spentUsd.toFixed(2)} $</p>
      </div>

      <div className="card stack">
        <h2>Clé API</h2>
        <p className="muted small">Clé actuelle : …{settings.apiKey.slice(-6)}</p>
        <div className="row">
          <input type="password" placeholder="Nouvelle clé sk-ant-…" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" />
          <button
            type="button"
            disabled={!apiKey.trim().startsWith('sk-')}
            onClick={async () => {
              await saveSettings({ apiKey: apiKey.trim() })
              setApiKey('')
              setMessage('Clé mise à jour ✅')
            }}
          >
            OK
          </button>
        </div>
      </div>

      <div className="card stack">
        <h2>Météo</h2>
        <LocationPicker value={settings.location} onChange={(location) => saveSettings({ location })} />
      </div>

      <div className="card stack">
        <h2>Sauvegarde</h2>
        <p className="muted small">
          {settings.lastExportAt
            ? `Dernière sauvegarde : ${new Date(settings.lastExportAt).toLocaleDateString('fr-FR')}`
            : 'Jamais sauvegardé.'}{' '}
          La clé API n'est pas incluse.
        </p>
        <button type="button" onClick={download}>
          💾 Exporter
        </button>
        <label className="button">
          📂 Importer une sauvegarde
          <input type="file" accept=".zip,application/zip" hidden onChange={(event) => setConfirmImport(event.target.files?.[0] ?? null)} />
        </label>
        {confirmImport && (
          <div className="card stack">
            <p className="small">Remplacer toute ta garde-robe actuelle par cette sauvegarde ?</p>
            <div className="row">
              <button type="button" className="danger" onClick={restore}>
                Oui, remplacer
              </button>
              <button type="button" onClick={() => setConfirmImport(null)}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {message && <p className="success">{message}</p>}
    </section>
  )
}

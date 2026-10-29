import { useState } from 'react'
import { locateMe, searchCity } from '../lib/weather'
import type { Location } from '../types'

export function LocationPicker({ value, onChange }: { value: Location | null; onChange: (location: Location) => void }) {
  const [city, setCity] = useState('')
  const [message, setMessage] = useState('')

  const useGps = async () => {
    setMessage('Localisation…')
    try {
      onChange(await locateMe())
      setMessage('')
    } catch (error) {
      setMessage((error as Error).message)
    }
  }

  const useCity = async () => {
    setMessage('Recherche…')
    const found = await searchCity(city.trim()).catch(() => null)
    if (found) {
      onChange(found)
      setMessage('')
    } else {
      setMessage('Ville introuvable.')
    }
  }

  return (
    <div className="stack">
      {value && <p>📍 {value.name}</p>}
      <button type="button" onClick={useGps}>
        Me localiser
      </button>
      <div className="row">
        <input placeholder="ou une ville" value={city} onChange={(event) => setCity(event.target.value)} />
        <button type="button" disabled={!city.trim()} onClick={useCity}>
          OK
        </button>
      </div>
      {message && <p className="muted small">{message}</p>}
    </div>
  )
}

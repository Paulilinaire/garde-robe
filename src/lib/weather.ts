import type { Location, Weather } from '../types'

const WEATHER_LABELS: [number[], string][] = [
  [[0], 'Ensoleillé'],
  [[1, 2], 'Éclaircies'],
  [[3], 'Couvert'],
  [[45, 48], 'Brouillard'],
  [[51, 53, 55, 56, 57], 'Bruine'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'Pluie'],
  [[71, 73, 75, 77, 85, 86], 'Neige'],
  [[95, 96, 99], 'Orage'],
]

export function weatherLabel(code: number): string {
  return WEATHER_LABELS.find(([codes]) => codes.includes(code))?.[1] ?? 'Variable'
}

export function weatherIcon(label: string): string {
  const icons: Record<string, string> = {
    Ensoleillé: '☀️',
    Éclaircies: '⛅',
    Couvert: '☁️',
    Brouillard: '🌫️',
    Bruine: '🌦️',
    Pluie: '🌧️',
    Neige: '❄️',
    Orage: '⛈️',
  }
  return icons[label] ?? '🌤️'
}

export async function getWeather(location: Location): Promise<Weather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '1',
  }).toString()
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Météo indisponible (${response.status})`)
  const data = await response.json()
  return {
    temperature: Math.round(data.current.temperature_2m),
    min: Math.round(data.daily.temperature_2m_min[0]),
    max: Math.round(data.daily.temperature_2m_max[0]),
    precipitation: data.daily.precipitation_probability_max[0] ?? 0,
    label: weatherLabel(data.current.weather_code),
  }
}

export async function searchCity(name: string): Promise<Location | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.search = new URLSearchParams({ name, count: '1', language: 'fr' }).toString()
  const response = await fetch(url)
  if (!response.ok) return null
  const data = await response.json()
  const result = data.results?.[0]
  return result ? { latitude: result.latitude, longitude: result.longitude, name: result.name } : null
}

export function locateMe(): Promise<Location> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: 'Ma position',
        }),
      () => reject(new Error('Géolocalisation refusée')),
      { timeout: 10000, maximumAge: 3600000 },
    )
  })
}

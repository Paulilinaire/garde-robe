import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS } from './db'
import type { Navigate, View } from './navigation'
import { Onboarding } from './screens/Onboarding'
import { Today } from './screens/Today'
import { Wardrobe } from './screens/Wardrobe'
import { ItemDetail } from './screens/ItemDetail'
import { AddItems } from './screens/AddItems'
import { History } from './screens/History'
import { More } from './screens/More'
import { Trends } from './screens/Trends'
import { StyleProfileScreen } from './screens/StyleProfile'
import { SettingsScreen } from './screens/Settings'
import type { Settings } from './types'

const TABS: { view: View; icon: string; label: string }[] = [
  { view: { name: 'today' }, icon: '✨', label: 'Tenue' },
  { view: { name: 'wardrobe' }, icon: '👗', label: 'Garde-robe' },
  { view: { name: 'add' }, icon: '➕', label: 'Ajouter' },
  { view: { name: 'history' }, icon: '🗓️', label: 'Historique' },
  { view: { name: 'more' }, icon: '☰', label: 'Plus' },
]

export function App() {
  const settingsRow = useLiveQuery(() => db.kv.get('settings'), [], null)
  const [view, setView] = useState<View>({ name: 'today' })

  const navigate: Navigate = (next) => {
    setView(next)
    window.scrollTo(0, 0)
  }

  if (settingsRow === null) return null
  const settings: Settings = { ...DEFAULT_SETTINGS, ...(settingsRow?.value as Partial<Settings> | undefined) }
  if (!settings.apiKey) return <Onboarding />

  return (
    <div className="app">
      <main className="screen">{renderView(view, navigate)}</main>
      <nav className="tabbar">
        {TABS.map((tab) => (
          <button
            key={tab.view.name}
            type="button"
            className={tab.view.name === view.name ? 'active' : ''}
            onClick={() => navigate(tab.view)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function renderView(view: View, navigate: Navigate) {
  switch (view.name) {
    case 'today':
      return <Today key={view.anchorItemId ?? 'today'} anchorItemId={view.anchorItemId} navigate={navigate} />
    case 'wardrobe':
      return <Wardrobe navigate={navigate} />
    case 'item':
      return <ItemDetail id={view.id} navigate={navigate} />
    case 'add':
      return <AddItems navigate={navigate} />
    case 'history':
      return <History />
    case 'more':
      return <More navigate={navigate} />
    case 'trends':
      return <Trends />
    case 'style':
      return <StyleProfileScreen />
    case 'settings':
      return <SettingsScreen />
  }
}

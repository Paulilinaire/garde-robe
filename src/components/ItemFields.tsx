import { CATEGORIES, CATEGORY_LABELS, SEASONS, type Category, type ItemAttributes, type Season } from '../types'

const SEASON_LABELS: Record<Season, string> = { printemps: 'Printemps', ete: 'Été', automne: 'Automne', hiver: 'Hiver' }

const toList = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

export function CategoryAndDescription<T extends ItemAttributes>({ value, onChange }: { value: T; onChange: (next: T) => void }) {
  return (
    <>
      <select value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value as Category })}>
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {CATEGORY_LABELS[category]}
          </option>
        ))}
      </select>
      <input value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} />
    </>
  )
}

export function ItemDetailsFields<T extends ItemAttributes>({ value, onChange }: { value: T; onChange: (next: T) => void }) {
  const toggleSeason = (season: Season) =>
    onChange({
      ...value,
      seasons: value.seasons.includes(season) ? value.seasons.filter((s) => s !== season) : [...value.seasons, season],
    })

  return (
    <div className="stack">
      <label>
        Type précis
        <input value={value.subtype} onChange={(event) => onChange({ ...value, subtype: event.target.value })} />
      </label>
      <label>
        Couleurs (séparées par des virgules)
        <input defaultValue={value.colors.join(', ')} onBlur={(event) => onChange({ ...value, colors: toList(event.target.value) })} />
      </label>
      <label>
        Matière
        <input value={value.material} onChange={(event) => onChange({ ...value, material: event.target.value })} />
      </label>
      <label>
        Motif
        <input value={value.pattern} onChange={(event) => onChange({ ...value, pattern: event.target.value })} />
      </label>
      <label>
        Styles (séparés par des virgules)
        <input defaultValue={value.styles.join(', ')} onBlur={(event) => onChange({ ...value, styles: toList(event.target.value) })} />
      </label>
      <div className="moods">
        {SEASONS.map((season) => (
          <button
            key={season}
            type="button"
            className={`chip${value.seasons.includes(season) ? ' active' : ''}`}
            onClick={() => toggleSeason(season)}
          >
            {SEASON_LABELS[season]}
          </button>
        ))}
      </div>
      <label>
        Chaleur : {value.warmth}/5
        <input
          type="range"
          min={1}
          max={5}
          value={value.warmth}
          onChange={(event) => onChange({ ...value, warmth: Number(event.target.value) })}
        />
      </label>
    </div>
  )
}

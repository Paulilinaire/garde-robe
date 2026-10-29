import type { Item } from '../types'
import { Thumb } from './Thumb'

export function OutfitBoard({
  items,
  onPick,
  highlight,
}: {
  items: Item[]
  onPick?: (item: Item) => void
  highlight?: boolean
}) {
  return (
    <div className={`board${highlight ? ' board-picking' : ''}`}>
      {items.map((item) => (
        <button key={item.id} type="button" className="board-tile" onClick={() => onPick?.(item)} disabled={!onPick}>
          <Thumb blob={item.photo} alt={item.description} />
          <span>{item.description}</span>
        </button>
      ))}
    </div>
  )
}

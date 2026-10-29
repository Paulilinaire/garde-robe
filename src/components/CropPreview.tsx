import type { Box } from '../types'

export function CropPreview({ url, box, naturalRatio }: { url: string; box: Box; naturalRatio: number }) {
  const aspect = (box.width / box.height) * naturalRatio
  return (
    <div className="crop" style={{ aspectRatio: String(aspect) }}>
      <img
        src={url}
        alt=""
        style={{
          width: `${100 / box.width}%`,
          left: `${(-box.x / box.width) * 100}%`,
          top: `${(-box.y / box.height) * 100}%`,
          height: `${100 / box.height}%`,
        }}
      />
    </div>
  )
}

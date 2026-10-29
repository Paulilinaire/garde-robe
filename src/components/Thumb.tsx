import { useObjectUrl } from '../hooks'

export function Thumb({ blob, alt, className }: { blob: Blob | undefined; alt: string; className?: string }) {
  const url = useObjectUrl(blob)
  return url ? <img src={url} alt={alt} className={className} loading="lazy" /> : <div className={`${className ?? ''} thumb-empty`} />
}

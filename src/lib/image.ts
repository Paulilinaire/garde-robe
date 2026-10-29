import type { Box } from '../types'

export const PHOTO_MAX_SIDE = 1000
export const THUMB_MAX_SIDE = 300
const WEBP_QUALITY = 0.82

async function drawToWebp(bitmap: ImageBitmap, source: { x: number; y: number; width: number; height: number }, maxSide: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height))
  const width = Math.max(1, Math.round(source.width * scale))
  const height = Math.max(1, Math.round(source.height * scale))
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d')!
  context.drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, width, height)
  return canvas.convertToBlob({ type: 'image/webp', quality: WEBP_QUALITY })
}

export async function resizeToWebp(blob: Blob, maxSide: number): Promise<Blob> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' })
  try {
    return await drawToWebp(bitmap, { x: 0, y: 0, width: bitmap.width, height: bitmap.height }, maxSide)
  } finally {
    bitmap.close()
  }
}

export async function cropToWebp(blob: Blob, box: Box, maxSide: number): Promise<Blob> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' })
  try {
    return await drawToWebp(
      bitmap,
      {
        x: box.x * bitmap.width,
        y: box.y * bitmap.height,
        width: box.width * bitmap.width,
        height: box.height * bitmap.height,
      },
      maxSide,
    )
  } finally {
    bitmap.close()
  }
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

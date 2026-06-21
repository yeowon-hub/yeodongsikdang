import { compressImageToDataUrl } from '@/lib/image'
import { callOpenAiVision, type DetectedIngredient } from '@/lib/ingredientVisionCore'

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error('Invalid image data')
  return { mimeType: match[1], base64: match[2] }
}

export async function analyzeIngredientImage(dataUrl: string): Promise<DetectedIngredient[]> {
  const { mimeType, base64 } = parseDataUrl(dataUrl)

  try {
    const res = await fetch('/api/analyze-ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    })

    if (res.ok) {
      const data = (await res.json()) as { items: DetectedIngredient[] }
      return data.items ?? []
    }

    if (res.status !== 503 && res.status !== 404) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(err.error ?? '이미지 분석에 실패했어요')
    }
  } catch (e) {
    if (e instanceof Error && !e.message.includes('fetch')) throw e
  }

  const devKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  if (devKey) {
    return callOpenAiVision(devKey, base64, mimeType)
  }

  throw new Error('이미지 자동 인식이 설정되지 않았어요. Vercel에 OPENAI_API_KEY를 추가해 주세요.')
}

export async function prepareImageForVision(file: File): Promise<string> {
  return compressImageToDataUrl(file, 1024)
}

export async function cropImageRegion(
  dataUrl: string,
  bbox: { left: number; top: number; right: number; bottom: number },
): Promise<string> {
  const img = await loadImage(dataUrl)
  const sx = Math.round(bbox.left * img.width)
  const sy = Math.round(bbox.top * img.height)
  const sw = Math.max(1, Math.round((bbox.right - bbox.left) * img.width))
  const sh = Math.max(1, Math.round((bbox.bottom - bbox.top) * img.height))

  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('이미지를 자를 수 없습니다')
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvas.toDataURL('image/jpeg', 0.85)
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이미지 로드 실패'))
    img.src = dataUrl
  })
}

export async function attachProductImages(
  sourceDataUrl: string,
  items: DetectedIngredient[],
): Promise<Array<DetectedIngredient & { imageUrl?: string }>> {
  return Promise.all(
    items.map(async (item) => {
      if (item.bbox) {
        try {
          const imageUrl = await cropImageRegion(sourceDataUrl, item.bbox)
          return { ...item, imageUrl }
        } catch {
          return { ...item, imageUrl: sourceDataUrl }
        }
      }
      return { ...item, imageUrl: sourceDataUrl }
    }),
  )
}

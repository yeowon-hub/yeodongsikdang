import { UNITS } from '../types'

export interface DetectedIngredientBBox {
  left: number
  top: number
  right: number
  bottom: number
}

export interface DetectedIngredient {
  name: string
  quantity: number
  unit: string
  expiryDate?: string
  bbox?: DetectedIngredientBBox
}

export interface IngredientVisionResult {
  items: DetectedIngredient[]
}

export const INGREDIENT_VISION_PROMPT = `You analyze photos of grocery products and online shopping cart screenshots for a Korean home kitchen app.

Extract EVERY distinct food/grocery product visible. For shopping cart screenshots with multiple line items, return one entry per product row.

Return JSON in this exact shape:
{"items":[{"name":"두부","quantity":1,"unit":"개","expiryDate":null,"bbox":null}]}

Field rules:
- name: Korean product name (concise)
- quantity: number (default 1)
- unit: one of ${UNITS.join(', ')}
- expiryDate: YYYY-MM-DD string if visible, otherwise null
- bbox: optional {left,top,right,bottom} normalized 0-1 crop of the product image, or null

Ignore delivery fees, coupons, ads, and non-food items.`

export function normalizeDetectedItem(raw: {
  name?: string
  quantity?: number | string
  unit?: string
  expiryDate?: string | null
  bbox?: DetectedIngredientBBox | null
}): DetectedIngredient | null {
  const name = raw.name?.trim()
  if (!name) return null

  let quantity = Number(raw.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) quantity = 1

  let unit = (raw.unit ?? '개').trim() || '개'
  if (!(UNITS as readonly string[]).includes(unit)) {
    const lower = unit.toLowerCase()
    if (lower.includes('kg') || unit.includes('킬로')) unit = 'kg'
    else if (lower.includes('g') || unit.includes('그램')) unit = 'g'
    else if (lower.includes('ml') || unit.includes('밀리')) unit = 'ml'
    else if (lower.includes('l') || unit.includes('리터')) unit = 'L'
    else if (unit.includes('팩')) unit = '팩'
    else if (unit.includes('봉')) unit = '봉'
    else unit = '개'
  }

  let expiryDate: string | undefined
  if (raw.expiryDate && /^\d{4}-\d{2}-\d{2}$/.test(raw.expiryDate)) {
    expiryDate = raw.expiryDate
  }

  let bbox: DetectedIngredientBBox | undefined
  if (raw.bbox) {
    const { left, top, right, bottom } = raw.bbox
    if (
      [left, top, right, bottom].every((n) => Number.isFinite(n)) &&
      right > left &&
      bottom > top
    ) {
      bbox = {
        left: clamp01(left),
        top: clamp01(top),
        right: clamp01(right),
        bottom: clamp01(bottom),
      }
    }
  }

  return { name, quantity, unit, expiryDate, bbox }
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

export function parseVisionResponse(content: string): DetectedIngredient[] {
  const parsed = JSON.parse(content) as { items?: unknown[] }
  if (!Array.isArray(parsed.items)) return []

  return parsed.items
    .map((item) => normalizeDetectedItem(item as Parameters<typeof normalizeDetectedItem>[0]))
    .filter((item): item is DetectedIngredient => item !== null)
}

function formatOpenAiError(status: number, detail: string): string {
  try {
    const parsed = JSON.parse(detail) as { error?: { message?: string; code?: string } }
    const message = parsed.error?.message
    if (status === 401) {
      return 'OpenAI API 키가 올바르지 않아요. OPENAI_API_KEY를 확인해 주세요.'
    }
    if (status === 429) {
      return 'OpenAI 사용량 한도에 걸렸어요. 잠시 후 다시 시도해 주세요.'
    }
    if (message) return message
  } catch {
    /* ignore */
  }
  return `OpenAI Vision API 오류 (${status})`
}

export async function callOpenAiVision(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
): Promise<DetectedIngredient[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: INGREDIENT_VISION_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'low',
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(formatOpenAiError(response.status, detail))
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Vision API returned empty response')

  try {
    return parseVisionResponse(content)
  } catch {
    throw new Error('Vision API 응답을 해석하지 못했어요. 다른 사진으로 다시 시도해 주세요.')
  }
}

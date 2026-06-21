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

For each product provide:
- name: Korean product name (concise, no brand fluff unless needed to identify)
- quantity: numeric amount (default 1)
- unit: one of ${UNITS.join(', ')} — pick the closest match
- expiryDate: YYYY-MM-DD if visible on packaging, otherwise null
- bbox: normalized crop region (0-1) of the product photo/thumbnail in the image. For a single product photo, bbox should tightly frame the product. For cart rows, bbox should frame that row's product image or the row area.

Ignore delivery fees, coupons, ads, and non-food items.
Return JSON only.`

export const INGREDIENT_VISION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          expiryDate: { type: ['string', 'null'] },
          bbox: {
            type: ['object', 'null'],
            properties: {
              left: { type: 'number' },
              top: { type: 'number' },
              right: { type: 'number' },
              bottom: { type: 'number' },
            },
            required: ['left', 'top', 'right', 'bottom'],
            additionalProperties: false,
          },
        },
        required: ['name', 'quantity', 'unit', 'expiryDate', 'bbox'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
} as const

export function normalizeDetectedItem(raw: {
  name: string
  quantity: number
  unit: string
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
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ingredient_detection',
          strict: true,
          schema: INGREDIENT_VISION_JSON_SCHEMA,
        },
      },
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Vision API failed (${response.status}): ${detail.slice(0, 200)}`)
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Vision API returned empty response')
  return parseVisionResponse(content)
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callOpenAiVision } from '../src/lib/ingredientVisionCore'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' })
  }

  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string
    mimeType?: string
  }

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'imageBase64 and mimeType are required' })
  }

  try {
    const items = await callOpenAiVision(apiKey, imageBase64, mimeType)
    return res.status(200).json({ items })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Vision analysis failed'
    return res.status(500).json({ error: message })
  }
}

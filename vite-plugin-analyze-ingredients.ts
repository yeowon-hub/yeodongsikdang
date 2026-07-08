import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: object) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function analyzeIngredientsDevApi(openAiKey: string | undefined): Plugin {
  return {
    name: 'analyze-ingredients-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0]
        if (path !== '/api/analyze-ingredients' || req.method !== 'POST') {
          next()
          return
        }

        if (!openAiKey) {
          sendJson(res, 503, {
            error:
              'OPENAI_API_KEY가 설정되지 않았어요. .env 파일에 OPENAI_API_KEY=sk-... 를 추가해 주세요.',
          })
          return
        }

        try {
          const { callOpenAiVision } = await import('./src/lib/ingredientVisionCore.ts')
          const body = (await readJsonBody(req)) as {
            imageBase64?: string
            mimeType?: string
          }

          if (!body.imageBase64 || !body.mimeType) {
            sendJson(res, 400, { error: 'imageBase64 and mimeType are required' })
            return
          }

          const items = await callOpenAiVision(openAiKey, body.imageBase64, body.mimeType)
          sendJson(res, 200, { items })
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Vision analysis failed'
          sendJson(res, 500, { error: message })
        }
      })
    },
  }
}

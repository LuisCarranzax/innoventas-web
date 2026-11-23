import express from 'express'
import { MAX_CHAT_MESSAGES, MAX_QUESTION_LENGTH, MAX_REPLY_LENGTH } from '../shared/chatLimits.js'

function validateMessages(messages) {
  if (!Array.isArray(messages) || !messages.length || messages.length > MAX_CHAT_MESSAGES) return null

  const input = []
  for (const message of messages) {
    if (!message || !['user', 'assistant'].includes(message.role) || typeof message.text !== 'string') return null
    const content = message.text.trim()
    const limit = message.role === 'user' ? MAX_QUESTION_LENGTH : MAX_REPLY_LENGTH
    if (!content || content.length > limit) return null
    input.push({ role: message.role, content })
  }
  return input.at(-1).role === 'user' ? input : null
}

export function createChatRouter(askFoundry) {
  const router = express.Router()

  router.get('/', (_request, response) => {
    response.set('Cache-Control', 'no-store').json({ mode: askFoundry ? 'foundry' : 'demo' })
  })

  router.post('/', express.json({ limit: '64kb' }), async (request, response) => {
    if (!askFoundry) return response.status(503).json({ error: 'Microsoft Foundry todavía no está configurado.' })

    const input = validateMessages(request.body?.messages)
    if (!input) return response.status(400).json({ error: 'La conversación contiene mensajes inválidos.' })

    const controller = new AbortController()
    response.once('close', () => controller.abort())
    const timeout = AbortSignal.timeout(45000)

    try {
      const reply = await askFoundry(input, AbortSignal.any([controller.signal, timeout]))
      if (!controller.signal.aborted) response.json({ reply })
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('Error al consultar Foundry:', error.message)
      response.status(timeout.aborted ? 504 : 502).json({
        error: timeout.aborted ? 'El asistente tardó demasiado en responder.' : 'No se pudo obtener una respuesta de Microsoft Foundry.',
      })
    }
  })

  router.use((error, _request, response, next) => {
    if (error.type === 'entity.too.large') {
      return response.status(413).json({ error: 'La conversación es demasiado larga.' })
    }
    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'El cuerpo de la consulta debe ser JSON válido.' })
    }
    next(error)
  })

  return router
}

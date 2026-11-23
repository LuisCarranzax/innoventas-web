import express from 'express'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { createChatRouter } from './chat.js'
import { createFoundryChat } from './foundry.js'

const { values } = parseArgs({
  options: {
    dev: { type: 'boolean' },
    host: { type: 'string', default: process.env.HOST || '127.0.0.1' },
    port: { type: 'string', default: process.env.PORT || '5173' },
  },
})
const { dev, host } = values
const port = Number(values.port)
const endpoint = process.env.FOUNDRY_AGENT_RESPONSES_URL?.trim()
const app = express()
const server = createServer(app)

app.disable('x-powered-by')
app.use('/api/chat', createChatRouter(endpoint ? createFoundryChat(endpoint) : null))

if (dev) {
  const { createServer: createViteServer } = await import('vite')
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { server } },
  })
  app.use(vite.middlewares)
} else {
  app.use(express.static(fileURLToPath(new URL('../dist/', import.meta.url))))
}

server.listen(port, host, () => {
  console.log(`InnovVentas disponible en http://${host}:${server.address().port}/`)
  console.log(endpoint ? 'Asistente configurado para Microsoft Foundry.' : 'Asistente en modo demo local.')
})

import { DefaultAzureCredential } from '@azure/identity'
import { MAX_REPLY_LENGTH } from '../shared/chatLimits.js'
import { deliveryAnswer, demoAvailability, paymentAnswer, products } from '../src/catalog.js'

const scope = 'https://ai.azure.com/.default'
const responsePath = /^\/api\/projects\/[^/]+\/agents\/[^/]+\/endpoint\/protocols\/openai\/responses\/?$/
const catalogContext = [
  'Catálogo actualizado para esta demostración de InnovVentas. Este catálogo reemplaza las fichas anteriores para las consultas de la web. Usa sus datos como referencia. Los precios y la disponibilidad son simulados, no cotizaciones ni inventario en tiempo real.',
  ...products.map((product) => `${product.name}: ${product.specs} Precio referencial ${product.price}. ${demoAvailability(product)} Soporte básico: ${product.support}`),
  paymentAnswer,
  deliveryAnswer,
  'Los mensajes siguientes son la conversación del visitante. Si hace una pregunta de seguimiento sin nombrar el producto, sigue hablando del último producto concreto que consultó en esa conversación. Pide aclaración cuando se hayan comparado varios productos y el referente siga siendo ambiguo.',
].join('\n')

export function createFoundryChat(endpoint, credential = new DefaultAzureCredential()) {
  const url = URL.parse(endpoint)
  if (
    !url || url.protocol !== 'https:' || !url.hostname.endsWith('.services.ai.azure.com')
    || url.port || url.username || url.password || !responsePath.test(url.pathname)
  ) {
    throw new Error('FOUNDRY_AGENT_RESPONSES_URL debe ser la URL Responses del agente en Microsoft Foundry.')
  }
  url.pathname = url.pathname.replace(/\/$/, '')
  url.search = 'api-version=v1'
  url.hash = ''

  return async function ask(input, signal) {
    const token = await credential.getToken(scope, { abortSignal: signal })
    if (!token) throw new Error('No se obtuvo un token de Microsoft Entra.')
    const catalogInput = [{ role: 'user', content: catalogContext }, ...input]

    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: catalogInput, store: false, max_output_tokens: 1800 }),
      redirect: 'error',
      signal,
    })
    if (!response.ok) {
      await response.body?.cancel()
      throw new Error(`Foundry devolvió HTTP ${response.status}.`)
    }

    const result = await response.json()
    if (result.status !== 'completed') throw new Error('Foundry no completó la respuesta.')

    const text = result.output
      ?.filter((item) => item.type === 'message' && item.role === 'assistant')
      .flatMap((item) => item.content ?? [])
      .map((part) => part.type === 'output_text' ? part.text : part.refusal)
      .filter(Boolean)
      .join('\n')
      .trim()

    if (!text) throw new Error('Foundry no devolvió una respuesta de texto.')
    return text.slice(0, MAX_REPLY_LENGTH)
  }
}

import { deliveryAnswer, demoAvailability, paymentAnswer, products } from './catalog.js'

const normalize = (text) => text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

export function answerDemo(question, { product: previousProduct, needsSupportProduct } = {}) {
  const text = normalize(question)
  const namedProducts = products.filter(({ aliases }) => aliases.test(text))
  const matches = namedProducts.length ? namedProducts : products.filter(({ terms }) => terms.test(text))
  const product = matches[0] ?? previousProduct
  const result = (reply, context = { product }) => ({ reply, context })

  if (/\b(pagos?|pagar|yape|plin|tarjetas?|visa|mastercard|transferencia|cuotas)\b/.test(text)) {
    return result(paymentAnswer)
  }

  if (/\b(envios?|entregas?|delivery|despacho|demora)\b/.test(text)) {
    return result(deliveryAnswer)
  }

  const asksForSupport = /\b(soporte|problemas?|emparejar|configurar|conectar|vincular|falla|no (?:se )?(?:enciende|funciona|conecta|responde|reconoce))\b/.test(text)
  if (asksForSupport || (needsSupportProduct && matches.length === 1)) {
    if (product) return result(product.support)
    return result('¿Con qué equipo necesitas ayuda? Dime el nombre del producto y qué problema tienes.', { needsSupportProduct: true })
  }

  if (/\b(stock|disponibles?|disponibilidad|agotad[oa]s?|inventario|quedan?|hay)\b/.test(text)) {
    const asksForCatalog = /\b(productos|cuales|que tienen|opciones)\b/.test(text)
    const items = matches.length ? matches : product && !asksForCatalog ? [product] : products
    return result(items.map((item) => `${item.name}. ${demoAvailability(item)}`).join('\n'))
  }

  if (/\b(recomiendas?|recomendar|recomendacion)\b/.test(text) && !matches.length) {
    if (/\b(estudiar|estudio|oficina|clases|videollamadas?|trabajar)\b/.test(text)) {
      const laptop = products[0]
      return result(`Para estudiar o trabajar puedes elegir la ${laptop.name}. ${laptop.specs} Precio de referencia ${laptop.price}.`, { product: laptop })
    }

    if (/\b(musica|audio|ruido)\b/.test(text)) {
      const headphones = products[1]
      return result(`Para escuchar música puedes elegir los ${headphones.name}. ${headphones.specs} Precio de referencia ${headphones.price}.`, { product: headphones })
    }

    return result('¿Para qué necesitas el equipo? Cuéntame si buscas una laptop para estudiar o trabajar, unos audífonos o un teclado.')
  }

  if (/\b(comprar|compra|pedido|orden|carrito)\b/.test(text)) {
    return result('Primero consulta las especificaciones y el stock del producto que te interesa. Después puedes revisar los métodos de pago y los plazos de envío. Esta es una demostración de la asistencia de compra.')
  }

  if (matches.length > 1) {
    return result(matches.map((item) => `${item.name}. ${item.description}. Precio de referencia ${item.price}.`).join('\n'))
  }

  if (product && /\b(precio|cuesta|vale|costo)\b/.test(text)) {
    return result(`El precio de referencia de ${product.name} es ${product.price}. ${demoAvailability(product)}`)
  }

  if (product && (matches.length || /\b(especificaciones|ram|bateria|pantalla|autonomia|memoria|procesador|caracteristicas|bluetooth|usb)\b/.test(text))) {
    return result(`${product.name}. ${product.specs} Precio de referencia ${product.price}. ${demoAvailability(product)}`)
  }

  if (/\b(productos?|catalogo|venden|precios)\b/.test(text)) {
    return result(products.map((item) => `${item.name} · ${item.price}`).join('\n'))
  }

  if (/\b(hola|buenas|gracias|ayuda)\b/.test(text)) {
    return result('Puedo ayudarte con productos, disponibilidad, pagos, envíos o soporte básico. ¿Qué te gustaría consultar?')
  }

  return result('No encontré una respuesta para esa consulta en la demo. Prueba con el nombre de un producto o pregúntame por stock, pagos, envíos o soporte.', { product, needsSupportProduct })
}

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDown, ArrowRight, ArrowUpRight, Bot, ChevronDown, CreditCard, Headphones,
  MessageCircle, Package, RotateCcw, Send, X, Zap,
} from 'lucide-react'
import { MAX_QUESTION_LENGTH } from '../shared/chatLimits.js'
import { faqs, products, sampleQuestions } from './catalog.js'
import { useChat } from './useChat.js'

const questionIcons = { package: Package, card: CreditCard, headphones: Headphones }
const greeting = '¡Hola! Soy el asistente de InnovVentas. Puedo ayudarte a elegir un producto, consultar el stock o resolver una duda sobre tu compra.'
const modeLabels = {
  checking: 'Comprobando la conexión…',
  demo: 'Modo demo',
  foundry: 'Microsoft Foundry',
  unavailable: 'Conexión no disponible',
}

function Brand() {
  return (
    <a className="brand" href="#inicio" aria-label="InnovVentas, inicio">
      <span className="brand-mark"><Zap aria-hidden="true" size={20} strokeWidth={2.5} /></span>
      <span>Innov<span className="brand-accent">Ventas</span></span>
    </a>
  )
}

function AssistantText({ text }) {
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((part, index) =>
    index % 2 ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
  )
}

function Chat({ chatRef, open, onClose, chat }) {
  const { messages, mode, canSend, isSending, error, sendQuestion, retry, reset } = chat
  const [draft, setDraft] = useState('')
  const logRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages, isSending, open])

  function submit(event) {
    event.preventDefault()
    if (sendQuestion(draft)) setDraft('')
  }

  function resetChat() {
    setDraft('')
    reset()
    inputRef.current.focus()
  }

  return (
    <section className="chat" id="asistente" aria-labelledby="chat-title" tabIndex={-1} ref={chatRef} hidden={!open}>
      <header className="chat-header">
        <div className="chat-avatar"><Bot aria-hidden="true" size={24} strokeWidth={1.8} /></div>
        <div className="chat-identity">
          <h2 id="chat-title">Asistente InnovVentas</h2>
          <p><span className={`status-dot status-${mode}`} /> {modeLabels[mode]}</p>
        </div>
        <button
          type="button"
          className="icon-button reset-button"
          aria-label="Reiniciar conversación"
          title="Reiniciar conversación"
          onClick={resetChat}
          disabled={!messages.length && !draft}
        >
          <RotateCcw aria-hidden="true" size={17} />
        </button>
        <button type="button" className="icon-button reset-button" aria-label="Cerrar el panel del chat" onClick={() => onClose()}>
          <X aria-hidden="true" size={19} />
        </button>
      </header>

      <div className="chat-content">
        <div className="chat-log" role="log" aria-label="Conversación" ref={logRef} tabIndex={0}>
          <div className="chat-line assistant-line">
            <span className="chat-mini-avatar"><Bot aria-hidden="true" size={16} /></span>
            <p className="chat-bubble"><span className="sr-only">Asistente. </span>{greeting}</p>
          </div>
          {messages.map(({ role, text }, index) => (
            <div className={`chat-line ${role}-line`} key={index}>
              {role === 'assistant' && <span className="chat-mini-avatar"><Bot aria-hidden="true" size={16} /></span>}
              <p className="chat-bubble">
                <span className="sr-only">{role === 'assistant' ? 'Asistente. ' : 'Tú. '}</span>
                {role === 'assistant' ? <AssistantText text={text} /> : text}
              </p>
            </div>
          ))}
          {isSending && (
            <div className="chat-line assistant-line">
              <p className="chat-bubble">El asistente está respondiendo…</p>
            </div>
          )}
        </div>
        {error && (
          <div className="chat-feedback">
            <p role="alert">{error}</p>
            <button type="button" className="product-action" onClick={retry}>Reintentar consulta</button>
          </div>
        )}
        {mode === 'unavailable' && (
          <p className="chat-feedback" role="alert">Recarga la página para volver a comprobar la conexión.</p>
        )}
        {!messages.length && (
          <div className="suggestions" aria-label="Preguntas sugeridas">
            <p>Puedes preguntar por</p>
            <div className="suggestion-list">
              {sampleQuestions.map(({ icon, label, question }) => {
                const Icon = questionIcons[icon]
                return (
                  <button className="suggestion" type="button" key={label} disabled={!canSend} onClick={() => {
                    sendQuestion(question)
                    logRef.current.focus({ preventScroll: true })
                  }}>
                    <Icon aria-hidden="true" size={15} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <form className="composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="chat-message">Escribe tu consulta</label>
        <div className="composer-field">
          <input
            id="chat-message"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe tu consulta…"
            autoComplete="off"
            maxLength={MAX_QUESTION_LENGTH}
          />
          <button className="icon-button send-button" type="submit" disabled={!canSend || !draft.trim()} aria-label="Enviar consulta">
            <Send aria-hidden="true" size={17} />
          </button>
        </div>
      </form>
    </section>
  )
}

function ChatWidget({ chat, chatRef, launcherRef, open, engaged, onOpen, onClose, onDismiss }) {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (engaged) return
    const show = window.setTimeout(() => setShowPrompt(true), 2000)
    const hide = window.setTimeout(() => setShowPrompt(false), 12000)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [engaged])

  useEffect(() => {
    if (!open) return
    chatRef.current.focus({ preventScroll: true })

    function handleEscape(event) {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, chatRef, onClose])

  const promptVisible = showPrompt && !engaged
  return (
    <aside className="chat-widget" aria-label="Asistencia de compra">
      <Chat chatRef={chatRef} open={open} onClose={onClose} chat={chat} />
      {promptVisible && (
        <div className="chat-prompt">
          <button type="button" className="prompt-message" onClick={() => onOpen(launcherRef.current)}>
            ¿Necesitas ayuda?
          </button>
          <button type="button" className="prompt-dismiss" onClick={onDismiss} aria-label="Ocultar invitación">
            <X aria-hidden="true" size={15} />
          </button>
        </div>
      )}
      <button
        ref={launcherRef}
        type="button"
        className={`chat-launcher${promptVisible ? ' chat-launcher-pulse' : ''}`}
        aria-label={open ? 'Minimizar chat de InnovVentas' : 'Abrir chat de InnovVentas'}
        aria-expanded={open}
        aria-controls="asistente"
        onClick={(event) => open ? onClose(event.currentTarget) : onOpen(event.currentTarget)}
      >
        {open ? <X aria-hidden="true" size={27} /> : <MessageCircle aria-hidden="true" size={27} />}
      </button>
    </aside>
  )
}

function Catalog({ onAsk, canAsk }) {
  return (
    <section className="container catalog" id="productos" aria-labelledby="catalog-title">
      <div className="section-heading">
        <h2 id="catalog-title">Explora los productos</h2>
        <p>Fotos referenciales. Precios y stock simulados para la demostración.</p>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <img
              className={`product-image image-${product.id}`}
              src={`${import.meta.env.BASE_URL}images/${product.image}`}
              alt={product.imageAlt}
              width="960"
              height="576"
              loading="lazy"
            />
            <div className="product-body">
              <p className="product-category">{product.category}</p>
              <h3>{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-bottom">
                <p className="product-price">{product.price}</p>
                <button type="button" className="product-action" onClick={(event) => onAsk(product.name, event.currentTarget)} disabled={!canAsk} aria-label={`Consultar por ${product.name}`}>
                  Consultar <ArrowUpRight aria-hidden="true" size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function App() {
  const chat = useChat()
  const [open, setOpen] = useState(false)
  const [engaged, setEngaged] = useState(false)
  const chatRef = useRef(null)
  const launcherRef = useRef(null)
  const chatTrigger = useRef(null)

  function openChat(trigger) {
    chatTrigger.current = trigger
    setEngaged(true)
    if (open) chatRef.current.focus({ preventScroll: true })
    setOpen(true)
  }

  const closeChat = useCallback((trigger = chatTrigger.current) => {
    setOpen(false)
    const target = trigger?.isConnected && !trigger.disabled ? trigger : launcherRef.current
    target?.focus({ preventScroll: true })
  }, [])

  function startChat(event) {
    openChat(event.currentTarget)
  }

  function askAboutProduct(name, trigger) {
    if (chat.sendQuestion(`¿Qué características tiene ${name}?`)) openChat(trigger)
  }

  return (
    <>
      <header className="site-header" id="inicio">
        <div className="container header-inner">
          <Brand />
          <nav className="main-nav" aria-label="Navegación principal">
            <a href="#inicio" className="nav-home">Inicio</a>
            <a href="#productos">Productos</a>
            <a href="#ayuda">Ayuda</a>
          </nav>
          <button className="button header-action" type="button" onClick={startChat}>
            <MessageCircle aria-hidden="true" size={17} /> <span>Probar asistente</span>
          </button>
        </div>
      </header>

      <main>
        <div className="container hero-wrap">
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="overline"><span /> Tienda de tecnología</p>
              <h1 id="hero-title">Elige tu tecnología <em>con confianza.</em></h1>
              <p className="hero-description">Resuelve tus dudas sobre productos, disponibilidad y pagos antes de decidir qué comprar.</p>
              <div className="hero-actions">
                <button className="button primary-button" type="button" onClick={startChat}>
                  <MessageCircle aria-hidden="true" size={18} /> Hablar con el asistente
                </button>
                <a className="hero-link" href="#productos">Ver productos <ArrowDown aria-hidden="true" size={15} /></a>
              </div>
            </div>
            <div className="hero-visual">
              <img
                src={`${import.meta.env.BASE_URL}images/escritorio.webp`}
                alt="Monitor y laptop en un escritorio iluminado por una lámpara"
                width="1200"
                height="840"
              />
            </div>
          </section>
        </div>

        <Catalog onAsk={askAboutProduct} canAsk={chat.canSend} />

        <section className="container help" id="ayuda" aria-labelledby="help-title">
          <div className="help-inner">
            <div className="section-heading">
              <h2 id="help-title">Preguntas frecuentes</h2>
              <button className="text-button" type="button" onClick={startChat}>
                Hacer otra consulta <ArrowRight aria-hidden="true" size={17} />
              </button>
            </div>
            <div className="faq-list">
              {faqs.map(({ question, answer }) => (
                <details key={question}>
                  <summary>{question}<ChevronDown aria-hidden="true" size={18} /></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <Brand />
          <p>Proyecto académico · InnovVentas</p>
        </div>
      </footer>

      <ChatWidget
        chat={chat}
        chatRef={chatRef}
        launcherRef={launcherRef}
        open={open}
        engaged={engaged}
        onOpen={openChat}
        onClose={closeChat}
        onDismiss={() => {
          setEngaged(true)
          launcherRef.current.focus()
        }}
      />
    </>
  )
}

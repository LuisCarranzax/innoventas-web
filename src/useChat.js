import { useEffect, useRef, useState } from 'react'
import { MAX_CHAT_MESSAGES, MAX_QUESTION_LENGTH } from '../shared/chatLimits.js'
import { answerDemo } from './demoChat.js'

const initialChat = { messages: [], context: {} }

export function useChat() {
  const [{ messages }, setChat] = useState(initialChat)
  const [mode, setMode] = useState('checking')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(null)
  const canSend = (mode === 'demo' || mode === 'foundry') && !isSending

  useEffect(() => {
    const controller = new AbortController()

    async function loadMode() {
      try {
        const response = await fetch('/api/chat', { signal: controller.signal, cache: 'no-store' })
        if (response.status === 404 || (response.ok && !response.headers.get('content-type')?.includes('application/json'))) {
          // A static deployment without the Node server can still run the demo.
          setMode('demo')
          return
        }
        if (!response.ok) throw new Error('Could not read chat configuration')
        const config = await response.json()
        if (!['demo', 'foundry'].includes(config.mode)) throw new Error('Unknown chat mode')
        if (!controller.signal.aborted) setMode(config.mode)
      } catch {
        if (!controller.signal.aborted) setMode('unavailable')
      }
    }

    void loadMode()
    return () => {
      controller.abort()
      pending.current?.abort()
    }
  }, [])

  async function requestReply(transcript) {
    const controller = new AbortController()
    pending.current = controller
    setIsSending(true)
    setError('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: transcript.slice(-MAX_CHAT_MESSAGES) }),
        signal: controller.signal,
      })
      const data = await response.json()
      if (!response.ok || typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error(data.error || 'El asistente no devolvió una respuesta.')
      }
      if (!controller.signal.aborted) {
        setChat({ messages: [...transcript, { role: 'assistant', text: data.reply }] })
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(error instanceof SyntaxError || error instanceof TypeError
          ? 'No se pudo conectar con el asistente.'
          : error.message)
      }
    } finally {
      if (pending.current === controller) {
        pending.current = null
        setIsSending(false)
      }
    }
  }

  function sendQuestion(value) {
    const question = value.trim()
    if (!canSend || pending.current || !question || question.length > MAX_QUESTION_LENGTH) return false

    const message = { role: 'user', text: question }
    if (mode === 'demo') {
      setChat((current) => {
        const result = answerDemo(question, current.context)
        return {
          context: result.context,
          messages: [...current.messages, message, { role: 'assistant', text: result.reply }],
        }
      })
    } else {
      const transcript = [...messages, message]
      setChat({ messages: transcript })
      void requestReply(transcript)
    }
    return true
  }

  function retry() {
    if (!pending.current && error && messages.at(-1)?.role === 'user') {
      void requestReply(messages)
    }
  }

  function reset() {
    pending.current?.abort()
    pending.current = null
    setIsSending(false)
    setError('')
    setChat(initialChat)
  }

  return { messages, mode, canSend, isSending, error, sendQuestion, retry, reset }
}

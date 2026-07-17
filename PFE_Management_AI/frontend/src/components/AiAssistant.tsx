import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { apiRequest, type AuthUser } from '../api'

type AiMode = 'chat' | 'summarize' | 'draft' | 'review'

interface AiDocument {
  id: number
  name: string
  original_name?: string | null
  type: string
  version: number
  status: string
  mime_type?: string | null
  size?: number | null
  pfe_title?: string | null
  ai_supported: boolean
}

interface AiConversation {
  id: number
  title: string
  mode: AiMode
  created_at: string
  updated_at: string
  messages_count?: number
}

interface AiMessage {
  id?: number
  role: 'user' | 'assistant'
  content: string
  metadata?: { document_name?: string; model?: string; mode?: AiMode } | null
  created_at?: string
}

interface AiBootstrap {
  configured: boolean
  model: string
  role: AuthUser['role']
  capabilities: AiMode[]
  suggestions: string[]
  documents: AiDocument[]
  conversations: AiConversation[]
}

interface ConversationPayload {
  conversation: AiConversation
  messages: AiMessage[]
}

interface ChatPayload {
  conversation: AiConversation
  message: AiMessage
}

const MODE_LABELS: Record<AiMode, string> = {
  chat: 'Conseil',
  summarize: 'Synthèse',
  draft: 'Rédaction',
  review: 'Relecture',
}

export default function AiAssistant({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false)
  const [bootstrap, setBootstrap] = useState<AiBootstrap | null>(null)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [mode, setMode] = useState<AiMode>('chat')
  const [documentId, setDocumentId] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const storageKey = `gestpfe_ai_conversation_${user.id}`

  const loadConversation = useCallback(async (id: number) => {
    setLoading(true); setError('')
    try {
      const payload = await apiRequest<ConversationPayload>(`/ai/conversations/${id}`)
      setConversationId(payload.conversation.id)
      setMode(payload.conversation.mode)
      setMessages(payload.messages)
      sessionStorage.setItem(storageKey, String(payload.conversation.id))
    } catch (reason) {
      sessionStorage.removeItem(storageKey)
      setConversationId(null)
      setMessages([])
      setError(reason instanceof Error ? reason.message : 'Conversation indisponible.')
    } finally { setLoading(false) }
  }, [storageKey])

  const loadBootstrap = useCallback(async () => {
    setAttempted(true); setLoading(true); setError('')
    try {
      const payload = await apiRequest<AiBootstrap>('/ai/bootstrap')
      setBootstrap(payload)
      const remembered = Number(sessionStorage.getItem(storageKey))
      if (remembered && payload.conversations.some((item) => item.id === remembered)) {
        await loadConversation(remembered)
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Assistant indisponible.')
    } finally { setLoading(false) }
  }, [loadConversation, storageKey])

  useEffect(() => {
    if (open && !bootstrap && !loading && !attempted) void loadBootstrap()
  }, [open, bootstrap, loading, attempted, loadBootstrap])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])

  const newConversation = () => {
    setConversationId(null)
    setMessages([])
    setMessage('')
    setDocumentId('')
    setMode('chat')
    setError('')
    sessionStorage.removeItem(storageKey)
  }

  const selectConversation = async (value: string) => {
    if (!value) { newConversation(); return }
    await loadConversation(Number(value))
  }

  const send = async (event: FormEvent) => {
    event.preventDefault()
    const content = message.trim()
    if (!content || busy || !bootstrap?.configured) return

    const optimistic: AiMessage = {
      role: 'user',
      content,
      metadata: documentId ? { document_name: bootstrap.documents.find((item) => item.id === Number(documentId))?.name } : null,
    }
    setMessages((current) => [...current, optimistic])
    setMessage(''); setBusy(true); setError('')

    try {
      const payload = await apiRequest<ChatPayload>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: conversationId,
          message: content,
          mode,
          document_id: documentId ? Number(documentId) : null,
        }),
      })
      setConversationId(payload.conversation.id)
      sessionStorage.setItem(storageKey, String(payload.conversation.id))
      setMessages((current) => [...current, payload.message])
      setBootstrap((current) => current ? {
        ...current,
        conversations: [
          payload.conversation,
          ...current.conversations.filter((item) => item.id !== payload.conversation.id),
        ],
      } : current)
    } catch (reason) {
      setMessages((current) => current.slice(0, -1))
      setMessage(content)
      setError(reason instanceof Error ? reason.message : 'Réponse IA impossible.')
    } finally { setBusy(false) }
  }

  const removeConversation = async () => {
    if (!conversationId || !window.confirm('Supprimer cette conversation IA ?')) return
    try {
      await apiRequest(`/ai/conversations/${conversationId}`, { method: 'DELETE' })
      setBootstrap((current) => current ? {
        ...current,
        conversations: current.conversations.filter((item) => item.id !== conversationId),
      } : current)
      newConversation()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Suppression impossible.')
    }
  }

  return <>
    <button
      type="button"
      className={`ai-launcher ${open ? 'is-open' : ''}`}
      onClick={() => setOpen((value) => !value)}
      aria-label={open ? 'Fermer GestPFE IA' : 'Ouvrir GestPFE IA'}
      aria-expanded={open}
    >
      <span className="ai-launcher-icon">✦</span>
      <span>GestPFE IA</span>
    </button>

    {open && <aside className="ai-panel" aria-label="Assistant GestPFE IA">
      <header className="ai-header">
        <div className="ai-avatar">✦</div>
        <div><strong>GestPFE IA</strong><span>Assistant sécurisé · {user.role_label}</span></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Fermer">×</button>
      </header>

      <div className="ai-toolbar">
        <select aria-label="Historique des conversations" value={conversationId ?? ''} onChange={(event) => void selectConversation(event.target.value)}>
          <option value="">＋ Nouvelle conversation</option>
          {bootstrap?.conversations.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        {conversationId && <button type="button" className="ai-delete" onClick={() => void removeConversation()} title="Supprimer la conversation">⌫</button>}
      </div>

      <div className="ai-modes" role="group" aria-label="Mode de travail">
        {(Object.keys(MODE_LABELS) as AiMode[]).map((item) => <button key={item} type="button" className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{MODE_LABELS[item]}</button>)}
      </div>

      <div className="ai-messages" ref={scrollRef} aria-live="polite">
        {loading && !bootstrap && <div className="ai-state">Chargement de l’assistant…</div>}
        {bootstrap && !bootstrap.configured && <div className="ai-config-warning">
          <strong>Configuration requise</strong>
          <span>Ajoutez votre clé dans <code>backend/.env</code> :</span>
          <code>GEMINI_API_KEY=votre_cle</code>
          <span>Puis exécutez <code>php artisan config:clear</code>.</span>
        </div>}
        {!loading && bootstrap?.configured && !messages.length && <div className="ai-welcome">
          <div className="ai-welcome-icon">✦</div>
          <strong>Bonjour {user.first_name}, comment puis-je vous aider ?</strong>
          <span>Je peux analyser votre espace GestPFE, résumer un document, relire ou préparer un contenu.</span>
          <div className="ai-suggestions">
            {bootstrap.suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setMessage(suggestion)}>{suggestion}</button>)}
          </div>
        </div>}
        {messages.map((item, index) => <article key={item.id ?? `${item.role}-${index}`} className={`ai-message ${item.role}`}>
          <div className="ai-message-label">{item.role === 'assistant' ? 'GestPFE IA' : 'Vous'}</div>
          <div className="ai-message-content">{item.content}</div>
          {item.metadata?.document_name && <div className="ai-attachment">▣ {item.metadata.document_name}</div>}
        </article>)}
        {busy && <div className="ai-typing"><i /><i /><i /><span>Analyse en cours…</span></div>}
      </div>

      {error && <div className="ai-error" role="alert">{error}</div>}

      <form className="ai-composer" onSubmit={send}>
        <select aria-label="Document à analyser" value={documentId} onChange={(event) => setDocumentId(event.target.value)} disabled={!bootstrap?.configured || busy}>
          <option value="">Aucun document joint</option>
          {bootstrap?.documents.map((document) => <option key={document.id} value={document.id} disabled={!document.ai_supported}>
            {document.name} · v{document.version}{document.ai_supported ? '' : ' (format non pris en charge)'}
          </option>)}
        </select>
        <div className="ai-input-row">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder="Posez une question sur votre PFE…"
            disabled={!bootstrap?.configured || busy}
            maxLength={8000}
          />
          <button type="submit" disabled={!message.trim() || !bootstrap?.configured || busy} aria-label="Envoyer">➤</button>
        </div>
        <small>L’IA peut se tromper. Vérifiez les décisions et contenus académiques importants.</small>
      </form>
    </aside>}
  </>
}

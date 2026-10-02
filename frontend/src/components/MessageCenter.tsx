import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, MessageSquareText, Send, X } from 'lucide-react'
import { API_BASE_URL } from '../config'
import { getToken, getUser } from '../lib/auth'

type Recipient = {
  id: number
  full_name: string
  role: string
  avatar_url?: string | null
}

type DirectMessage = {
  id: number
  sender_id: number
  receiver_id: number
  content: string
  created_at: string
}

function MessageCenter() {
  const user = getUser()
  const [isOpen, setIsOpen] = useState(false)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [selectedRecipientId, setSelectedRecipientId] = useState('')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const selectedRecipient = recipients.find((recipient) => String(recipient.id) === selectedRecipientId)
  const thread = useMemo(() => {
    if (!selectedRecipient) return []
    return messages
      .filter((message) =>
        (Number(message.sender_id) === Number(user?.id) && Number(message.receiver_id) === Number(selectedRecipient.id))
        || (Number(message.sender_id) === Number(selectedRecipient.id) && Number(message.receiver_id) === Number(user?.id)),
      )
      .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
  }, [messages, selectedRecipient, user?.id])

  const loadInbox = async () => {
    const token = getToken()
    if (!token) return
    setIsLoading(true)
    setError('')
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [recipientResponse, messageResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/message-recipients`, { headers }),
        fetch(`${API_BASE_URL}/api/messages`, { headers }),
      ])
      const recipientBody = await recipientResponse.json().catch(() => ({}))
      const messageBody = await messageResponse.json().catch(() => ({}))
      if (!recipientResponse.ok) throw new Error(recipientBody.message || 'Could not load recipients.')
      if (!messageResponse.ok) throw new Error(messageBody.message || 'Could not load messages.')
      const nextRecipients = recipientBody.recipients ?? []
      setRecipients(nextRecipients)
      setMessages(messageBody.messages ?? [])
      setSelectedRecipientId((current) =>
        nextRecipients.some((recipient: Recipient) => String(recipient.id) === current)
          ? current
          : String(nextRecipients[0]?.id ?? ''),
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load messages.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) void loadInbox()
  }, [isOpen])

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = draft.trim()
    const token = getToken()
    if (!token || !selectedRecipient || !content) return

    setIsSending(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: selectedRecipient.id, content }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Message could not be sent.')
      setDraft('')
      await loadInbox()
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Message could not be sent.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Open direct messages"
        title="Direct messages"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-700"
        onClick={() => setIsOpen((open) => !open)}
      >
        <MessageSquareText className="h-4 w-4" />
        Messages
      </button>

      {isOpen && (
        <section role="dialog" aria-label="Direct messages" className="absolute right-0 top-12 z-50 flex h-[min(34rem,75vh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Direct messages</h2>
              <p className="text-xs text-slate-500">Private one-to-one conversations</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" title="Refresh messages" aria-label="Refresh messages" disabled={isLoading} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50" onClick={() => void loadInbox()}>
                <LoaderCircle className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button type="button" title="Close messages" aria-label="Close messages" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {recipients.length > 0 && (
            <div className="border-b border-slate-100 px-4 py-3">
              <label htmlFor="message-recipient" className="text-xs font-semibold text-slate-600">Conversation with</label>
              <select id="message-recipient" value={selectedRecipientId} onChange={(event) => setSelectedRecipientId(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-orange-400 focus:outline-none">
                {recipients.map((recipient) => (
                  <option key={recipient.id} value={recipient.id}>{recipient.full_name} · {recipient.role}</option>
                ))}
              </select>
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
            {isLoading && messages.length === 0 && <p className="text-center text-sm text-slate-500">Loading messages…</p>}
            {!isLoading && recipients.length === 0 && <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-600">No other accounts are registered yet. Create another account to start a conversation.</p>}
            {selectedRecipient && thread.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No messages with {selectedRecipient.full_name} yet. Send the first message below.</p>}
            {thread.map((message) => {
              const sentByMe = Number(message.sender_id) === Number(user?.id)
              return (
                <div key={message.id} className={`flex ${sentByMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 ${sentByMe ? 'bg-orange-500 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                    <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                    <time className={`mt-1 block text-right text-[10px] ${sentByMe ? 'text-orange-50' : 'text-slate-400'}`}>
                      {new Date(message.created_at).toLocaleString()}
                    </time>
                  </div>
                </div>
              )
            })}
          </div>

          {error && <p role="alert" className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</p>}

          <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
            <textarea
              aria-label="Write a direct message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={5000}
              rows={2}
              disabled={!selectedRecipient || isSending}
              placeholder={selectedRecipient ? 'Write a message…' : 'No recipient available'}
              className="min-h-10 flex-1 resize-none rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none disabled:bg-slate-50"
            />
            <button type="submit" aria-label="Send message" title="Send message" disabled={!selectedRecipient || !draft.trim() || isSending} className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </div>
  )
}

export default MessageCenter

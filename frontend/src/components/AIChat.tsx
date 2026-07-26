import { useRef, useState, useEffect } from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'
import { useAIChat } from '@/api/ai'
import type { ChatMessage } from '@/types'

export function AIChat({ ticketId }: { ticketId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const chat = useAIChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, chat.isPending])

  const send = () => {
    const text = input.trim()
    if (!text || chat.isPending) return
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    chat.mutate(
      { ticketId, message: text, history: messages },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `⚠️ ${(err as Error).message}` },
          ])
        },
      }
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-graphite-400">
            <Sparkles className="h-5 w-5 text-signal-400" />
            <p className="text-[13px]">
              Posez une question technique sur ce ticket.
              <br />
              L'assistant a le contexte complet du diagnostic.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-graphite-900 text-white'
                  : 'border border-graphite-100 bg-porcelain text-graphite-700'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {chat.isPending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-graphite-100 bg-porcelain px-3.5 py-2.5 text-[13px] text-graphite-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Réflexion en cours…
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-graphite-100 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ex : quelle pièce commander en premier ?"
          className="flex-1 rounded border border-graphite-200 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-signal-400 focus:shadow-focus"
        />
        <button
          onClick={send}
          disabled={!input.trim() || chat.isPending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-graphite-900 text-white transition-colors hover:bg-graphite-800 disabled:bg-graphite-200"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

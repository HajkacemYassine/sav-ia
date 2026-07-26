import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { usePreDiagChat } from '@/api/ai'

type Message = { role: 'user' | 'assistant'; content: string }

interface PreDiagChatProps {
  clientId: string
  productId: string
  invoiceId?: string
  productLabel: string
  description: string
}

export function PreDiagChat({
  clientId,
  productId,
  invoiceId,
  productLabel,
  description,
}: PreDiagChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [readyToDiagnose, setReadyToDiagnose] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const chat = usePreDiagChat()

  useEffect(() => {
    chat.mutate(
      { clientId, productId, invoiceId, productLabel, description, messages: [] },
      {
        onSuccess: (data) => {
          if (data.question) {
            setMessages([{ role: 'assistant', content: data.question }])
          }
        },
      }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, productId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text || chat.isPending) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')

    chat.mutate(
      { clientId, productId, invoiceId, productLabel, description, messages: newMessages },
      {
        onSuccess: (data) => {
          if (data.done) {
            setReadyToDiagnose(true)
          } else if (data.question) {
            setMessages((prev) => [...prev, { role: 'assistant', content: data.question! }])
          }
        },
      }
    )
  }

  if (readyToDiagnose) {
    return (
      <Card className="flex flex-col items-center gap-3 border-signal-100 bg-signal-50 p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
          <Loader2 className="h-4 w-4 animate-spin text-signal-500" />
        </div>
        <div>
          <p className="font-display text-[14.5px] font-semibold text-signal-800">
            Diagnostic IA en cours d'analyse
          </p>
          <p className="mt-1 text-[13px] text-signal-600">
            Merci pour vos précisions. L'IA analyse votre dossier, cette page se met à jour
            automatiquement.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-graphite-100 px-5 py-3.5">
        <Sparkles className="h-4 w-4 text-signal-500" />
        <p className="text-[13.5px] font-semibold text-graphite-800">
          L'IA a besoin de quelques précisions
        </p>
      </div>

      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-signal-500 text-white'
                  : 'bg-graphite-50 text-graphite-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {chat.isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-graphite-50 px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-graphite-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-graphite-100 p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Votre réponse…"
          className="flex-1 rounded border border-graphite-200 px-3.5 py-2 text-[13.5px] outline-none focus:border-signal-400"
        />
        <Button
          size="sm"
          disabled={!input.trim() || chat.isPending}
          onClick={send}
          icon={<Send className="h-3.5 w-3.5" />}
        >
          Envoyer
        </Button>
      </div>
    </Card>
  )
}

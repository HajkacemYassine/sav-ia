import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Send,
  Sparkles,
  Wrench,
  ThumbsUp,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { FocusShell } from '@/components/layout/FocusShell'
import { Button } from '@/components/ui/Button'
import { Card, Field, inputClass } from '@/components/ui/primitives'
import { useApp } from '@/context/AppContext'
import { useClientInvoices } from '@/api/catalog'
import { useCreateTicket } from '@/api/tickets'
import { usePreDiagChat } from '@/api/ai'
import type { Product } from '@/types'

type Message = { role: 'user' | 'assistant'; content: string }

const STEPS = ['Appareil', 'Description', 'Conversation IA', 'Confirmation']

export default function DeclarePanne() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [product, setProduct] = useState<Product | null>(null)
  const [description, setDescription] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [verdict, setVerdict] = useState<{
    needs_technician: boolean
    summary: string
    guide_id?: string
    guide_number?: string
    repair_steps?: string[]
    safety_warnings?: string[]
  } | null>(null)
  const createTicket = useCreateTicket()

  const canNext =
    (step === 0 && !!product) ||
    (step === 1 && description.trim().length >= 20) ||
    (step === 2 && verdict !== null && verdict.needs_technician)

  const submit = () => {
    if (!user || !product || !verdict) return
    const enrichedDescription =
      description +
      '\n\nPrécisions apportées lors de la conversation :\n' +
      messages
        .filter((m) => m.role === 'user')
        .map((m) => `- ${m.content}`)
        .join('\n')

    createTicket.mutate(
      {
        client_id: user.id,
        product_id: product.id,
        description_raw: enrichedDescription.trim(),
      },
      {
        onSuccess: (ticket) => navigate(`/client/tickets/${ticket.id}`, { replace: true }),
      }
    )
  }

  const autoCreatedGuide = verdict && !verdict.needs_technician && verdict.guide_id

  return (
    <FocusShell>
      <div className="mb-8">
        <h1 className="font-display text-xl font-semibold text-graphite-900">
          Déclarer une panne
        </h1>
        <p className="mt-1 text-[13.5px] text-graphite-500">
          L'IA discute avec vous avant de créer votre dossier.
        </p>
      </div>

      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => {
          if (autoCreatedGuide && i === 3) return null
          return (
            <li key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  i < step
                    ? 'bg-graphite-900 text-white'
                    : i === step
                    ? 'bg-signal-500 text-white'
                    : 'bg-graphite-100 text-graphite-400'
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span
                className={`text-[12.5px] font-medium ${
                  i <= step ? 'text-graphite-800' : 'text-graphite-300'
                }`}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="ml-1 h-px flex-1 bg-graphite-100" />}
            </li>
          )
        })}
      </ol>

      {step === 0 && <ProductStep value={product} onChange={setProduct} clientId={user?.id} invoiceId={user?.invoiceId} />}
      {step === 1 && (
        <DescriptionStep value={description} onChange={setDescription} product={product} />
      )}
      {step === 2 && product && user && (
        <ChatStep
          product={product}
          description={description}
          messages={messages}
          onMessages={setMessages}
          onVerdict={setVerdict}
          verdict={verdict}
          clientId={user.id}
          invoiceId={user.invoiceId}
        />
      )}
      {step === 3 && product && verdict && (
        <ConfirmStep
          product={product}
          description={description}
          verdict={verdict}
        />
      )}

      {autoCreatedGuide && (
        <SelfServiceResult
          guideId={verdict.guide_id!}
          guideNumber={verdict.guide_number!}
          summary={verdict.summary}
          repairSteps={verdict.repair_steps}
          safetyWarnings={verdict.safety_warnings}
          onNavigate={() => navigate(`/client/guides/${verdict.guide_id}`, { replace: true })}
        />
      )}

      <div className="mt-7 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || !!autoCreatedGuide}
        >
          <ChevronLeft className="h-4 w-4" /> Retour
        </Button>

        {step < 3 && !autoCreatedGuide ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Continuer <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          !autoCreatedGuide && (
            <Button
              onClick={submit}
              loading={createTicket.isPending}
              icon={<Sparkles className="h-4 w-4" />}
            >
              Créer le dossier
            </Button>
          )
        )}
      </div>

      {createTicket.isError && (
        <p className="mt-3 text-right text-[12.5px] text-alert-500">
          {(createTicket.error as Error).message}
        </p>
      )}
    </FocusShell>
  )
}

// ── Étape 1 : Appareil ───────────────────────────────────────────────────
function ProductStep({
  value,
  onChange,
  clientId,
  invoiceId,
}: {
  value: Product | null
  onChange: (p: Product) => void
  clientId?: string
  invoiceId?: string
}) {
  const [query, setQuery] = useState('')
  const { data: invoices, isLoading } = useClientInvoices(clientId)

  const products: Product[] = (invoices ?? []).flatMap((inv) =>
    inv.products.map(p => ({ id: p.id, brand: p.brand, model: p.model, category: p.category, repairable: true }))
  )

  const pool = invoiceId
    ? (invoices?.find((inv) => inv.id === invoiceId)?.products ?? []).map(p => ({ id: p.id, brand: p.brand, model: p.model, category: p.category, repairable: true }))
    : products

  const filtered = pool.filter((p) => {
    const q = query.toLowerCase()
    return p.brand.toLowerCase().includes(q) || p.model.toLowerCase().includes(q)
  })

  return (
    <Card className="p-5">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par marque ou modèle…"
          className={`${inputClass} pl-9`}
        />
      </div>
      <div className="max-h-80 space-y-1.5 overflow-y-auto">
        {isLoading && <p className="py-8 text-center text-[13px] text-graphite-400">Chargement…</p>}
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p)}
            className={`flex w-full items-center justify-between rounded border px-3.5 py-3 text-left transition-colors ${
              value?.id === p.id
                ? 'border-signal-400 bg-signal-50'
                : 'border-graphite-100 hover:border-graphite-200 hover:bg-graphite-50'
            }`}
          >
            <div>
              <p className="text-[13.5px] font-medium text-graphite-800">
                {p.brand} {p.model}
              </p>
              <p className="mt-0.5 text-[12px] text-graphite-400">{p.category}</p>
            </div>
            {value?.id === p.id && <Check className="h-4 w-4 text-signal-600" />}
          </button>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="py-8 text-center text-[13px] text-graphite-400">Aucun appareil trouvé.</p>
        )}
      </div>
    </Card>
  )
}

// ── Étape 2 : Description ────────────────────────────────────────────────
function DescriptionStep({
  value,
  onChange,
  product,
}: {
  value: string
  onChange: (v: string) => void
  product: Product | null
}) {
  return (
    <Card className="p-5">
      {product && (
        <div className="mb-4 rounded border border-graphite-100 bg-porcelain px-3.5 py-2.5 text-[13px] text-graphite-500">
          Appareil sélectionné :{' '}
          <span className="font-medium text-graphite-800">
            {product.brand} {product.model}
          </span>
        </div>
      )}
      <Field
        label="Décrivez la panne aussi précisément que possible"
        hint={`${value.trim().length} / 20 caractères minimum`}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={7}
          placeholder="Ex : Le lave-linge perd de l'eau sous la porte depuis ce matin…"
          className={`${inputClass} resize-none`}
        />
      </Field>
    </Card>
  )
}

// ── Étape 3 : Conversation IA ────────────────────────────────────────────
function ChatStep({
  product,
  description,
  messages,
  onMessages,
  onVerdict,
  verdict,
  clientId,
  invoiceId,
}: {
  product: Product
  description: string
  messages: Message[]
  onMessages: (m: Message[]) => void
  onVerdict: (v: {
    needs_technician: boolean
    summary: string
    guide_id?: string
    guide_number?: string
    repair_steps?: string[]
    safety_warnings?: string[]
  }) => void
  verdict: {
    needs_technician: boolean
    summary: string
    guide_id?: string
    guide_number?: string
    repair_steps?: string[]
    safety_warnings?: string[]
  } | null
  clientId: string
  invoiceId?: string
}) {
  const productLabel = `${product.brand} ${product.model} (${product.category})`
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const chat = usePreDiagChat()

  const isRawJson = (text: string) => {
    const trimmed = text.trim()
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || trimmed.startsWith('```json')
  }

  useEffect(() => {
    if (messages.length > 0 || verdict) return
    chat.mutate(
      { clientId, productId: product.id, invoiceId, productLabel, description, messages: [] },
      {
        onSuccess: (data) => {
          if (data.done && data.needs_technician !== null && data.summary) {
            onVerdict({
              needs_technician: data.needs_technician,
              summary: data.summary,
              guide_id: data.guide_id ?? undefined,
              guide_number: data.guide_number ?? undefined,
              repair_steps: data.repair_steps,
              safety_warnings: data.safety_warnings,
            })
          } else if (data.question && !isRawJson(data.question)) {
            onMessages([{ role: 'assistant', content: data.question }])
          }
        },
      }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text || chat.isPending || verdict) return
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    onMessages(newMessages)
    setInput('')
    chat.mutate(
      { clientId, productId: product.id, invoiceId, productLabel, description, messages: newMessages },
      {
        onSuccess: (data) => {
          if (data.done && data.needs_technician !== null && data.summary) {
            onVerdict({
              needs_technician: data.needs_technician,
              summary: data.summary,
              guide_id: data.guide_id ?? undefined,
              guide_number: data.guide_number ?? undefined,
              repair_steps: data.repair_steps,
              safety_warnings: data.safety_warnings,
            })
          } else if (data.question && !isRawJson(data.question)) {
            onMessages([...newMessages, { role: 'assistant', content: data.question }])
          }
        },
      }
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-graphite-100 px-5 py-3.5">
        <Sparkles className="h-4 w-4 text-signal-500" />
        <p className="text-[13.5px] font-semibold text-graphite-800">
          L'IA analyse votre panne
        </p>
      </div>

      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
            <div className="rounded-2xl bg-graphite-50 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-graphite-400" />
            </div>
          </div>
        )}

        {verdict && (
          <div
            className={`mt-2 flex items-start gap-3 rounded-xl border p-4 ${
              verdict.needs_technician
                ? 'border-alert-100 bg-alert-50'
                : 'border-repair-100 bg-repair-50'
            }`}
          >
            {verdict.needs_technician ? (
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-alert-500" />
            ) : (
              <ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-repair-600" />
            )}
            <div>
              <p className={`text-[13.5px] font-semibold ${verdict.needs_technician ? 'text-alert-700' : 'text-repair-700'}`}>
                {verdict.needs_technician
                  ? 'Un technicien est nécessaire'
                  : 'Réparable sans technicien'}
              </p>
              <p className="mt-0.5 text-[13px] text-graphite-600">{verdict.summary}</p>
              {!verdict.needs_technician && verdict.guide_number && (
                <p className="mt-1.5 text-[12.5px] font-medium text-repair-600">
                  Guide {verdict.guide_number} créé automatiquement
                </p>
              )}
              {verdict.needs_technician && (
                <p className="mt-2 text-[12.5px] text-graphite-400">
                  Cliquez sur "Continuer" pour valider ou annuler la création du dossier.
                </p>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!verdict && (
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
      )}
    </Card>
  )
}

// ── Résultat self-service : guide créé ────────────────────────────────────
function SelfServiceResult({
  guideId,
  guideNumber,
  summary,
  repairSteps,
  safetyWarnings,
  onNavigate,
}: {
  guideId: string
  guideNumber: string
  summary: string
  repairSteps?: string[]
  safetyWarnings?: string[]
  onNavigate: () => void
}) {
  return (
    <Card className="border-repair-100 bg-repair-50/40 p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-repair-100">
          <ThumbsUp className="h-4 w-4 text-repair-600" />
        </div>
        <div>
          <p className="font-display text-[14.5px] font-semibold text-repair-800">
            Guide de réparation créé
          </p>
          <p className="text-[12.5px] text-graphite-500">
            {guideNumber}
          </p>
        </div>
      </div>

      <p className="mb-4 text-[13.5px] leading-relaxed text-graphite-700">{summary}</p>

      {repairSteps && repairSteps.length > 0 && (
        <div className="mb-4">
          <p className="label-caps mb-2 text-graphite-400">Étapes de réparation</p>
          <ol className="space-y-2">
            {repairSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-graphite-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-repair-100 text-[11px] font-semibold text-repair-700">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {safetyWarnings && safetyWarnings.length > 0 && (
        <div className="mb-4 flex items-start gap-2.5 rounded border border-alert-100 bg-alert-50 px-3.5 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-alert-500" />
          <div>
            <p className="label-caps text-alert-600">Précautions</p>
            <ul className="mt-1 space-y-0.5 text-[12.5px] text-alert-600">
              {safetyWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      <Button
        onClick={onNavigate}
        icon={<ExternalLink className="h-3.5 w-3.5" />}
      >
        Voir mon dossier
      </Button>
    </Card>
  )
}

// ── Étape 4 : Confirmation ───────────────────────────────────────────────
function ConfirmStep({
  product,
  description,
  verdict,
}: {
  product: Product
  description: string
  verdict: { needs_technician: boolean; summary: string }
}) {
  return (
    <Card className="p-5">
      <p className="label-caps mb-3 text-graphite-400">Récapitulatif</p>
      <div className="space-y-4">
        <div>
          <p className="text-[12px] text-graphite-400">Appareil</p>
          <p className="text-[14px] font-medium text-graphite-800">
            {product.brand} {product.model} · {product.category}
          </p>
        </div>
        <div>
          <p className="text-[12px] text-graphite-400">Description</p>
          <p className="text-[14px] leading-relaxed text-graphite-700">{description}</p>
        </div>
        <div>
          <p className="text-[12px] text-graphite-400">Verdict IA</p>
          <p className="text-[14px] leading-relaxed text-graphite-700">{verdict.summary}</p>
        </div>
      </div>

      <div
        className={`mt-5 flex items-start gap-2.5 rounded border px-3.5 py-3 ${
          verdict.needs_technician
            ? 'border-alert-100 bg-alert-50'
            : 'border-repair-100 bg-repair-50'
        }`}
      >
        {verdict.needs_technician ? (
          <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-alert-500" />
        ) : (
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-repair-600" />
        )}
        <p className="text-[12.5px] leading-relaxed text-graphite-700">
          {verdict.needs_technician
            ? 'Un technicien sera assigné à votre dossier. Le diagnostic IA se lancera automatiquement à la création.'
            : 'La panne semble gérable. Un diagnostic IA sera quand même lancé pour confirmer.'}
        </p>
      </div>
    </Card>
  )
}

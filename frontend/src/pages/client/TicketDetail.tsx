import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Pencil,
  Check,
  X,
  AlertTriangle,
  Wrench,
  Send,
} from 'lucide-react'
import { useState } from 'react'
import { FocusShell } from '@/components/layout/FocusShell'
import { Spinner, Card, PlateBadge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { ClientTimeline } from '@/components/ClientTimeline'
import { ClientDiagnosticPanel } from '@/components/ClientDiagnosticPanel'
import { useTicket, useUpdateTicketDescription, useEscalateTicket } from '@/api/tickets'
import { useProduct } from '@/api/catalog'
import { PRIORITY_META, STATUS_META } from '@/lib/status'
import { formatDateTime } from '@/lib/format'

export default function TicketDetail() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { data: ticket, isLoading } = useTicket(ticketId, { poll: true })
  const { data: product } = useProduct(ticket?.product_id)
  const updateDescription = useUpdateTicketDescription()
  const escalateTicket = useEscalateTicket()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const startEdit = () => {
    setDraft(ticket?.description_raw ?? '')
    setEditing(true)
  }

  const cancelEdit = () => setEditing(false)

  const saveEdit = () => {
    if (!ticketId || draft.trim().length < 20) return
    updateDescription.mutate(
      { ticketId, description: draft },
      { onSuccess: () => setEditing(false) }
    )
  }

  const handleEscalate = () => {
    if (!ticketId) return
    escalateTicket.mutate(ticketId)
  }

  if (isLoading || !ticket) {
    return (
      <FocusShell width="max-w-3xl">
        <Spinner label="Chargement du dossier…" />
      </FocusShell>
    )
  }

  const priority = PRIORITY_META[ticket.priority]
  const waitingDiagnosis = !ticket.ai_diagnosis && ticket.status !== 'cancelled'
  const isSelfService = ticket.status === 'self_service'
  const diagnosisData = ticket.ai_diagnosis as unknown as Record<string, unknown> | null
  const hasRepairSteps = !!diagnosisData?.repair_steps
  const hasPreDiagSource = diagnosisData?.source === 'pre_diagnostic_chat'

  return (
    <FocusShell width="max-w-4xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          icon={<ArrowLeft className="h-3.5 w-3.5" />}
          onClick={() => navigate('/client')}
        >
          Mes dossiers
        </Button>
      </div>

      <div className="grid gap-6">
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-mono text-lg font-semibold text-graphite-900">
                  {ticket.ticket_number}
                </h1>
                {(ticket.priority === 'high' || ticket.priority === 'critical') && (
                  <PlateBadge {...priority} label={priority.label} />
                )}
                {isSelfService && (
                  <span className="label-caps rounded border border-signal-100 bg-signal-50 px-2 py-0.5 text-signal-600">
                    Auto-diagnostic
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] text-graphite-400">
                Déclaré le {formatDateTime(ticket.created_at)}
                {product && ` · ${product.brand} ${product.model}`}
              </p>
            </div>
          </div>

          <Card className="mb-6 p-5">
            <ClientTimeline status={ticket.status} />
          </Card>

          <Card className="mb-6 p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="label-caps text-graphite-400">Votre description</p>
              {!editing && (
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1 text-[12px] text-graphite-400 hover:text-signal-600"
                >
                  <Pencil className="h-3 w-3" /> Modifier
                </button>
              )}
            </div>
            {editing ? (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={5}
                  className="w-full rounded border border-graphite-200 px-3 py-2 text-[14px] text-graphite-800 outline-none focus:border-signal-400"
                />
                {draft.trim().length < 20 && (
                  <p className="mt-1 text-[12px] text-alert-500">Minimum 20 caractères</p>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    icon={<Check className="h-3.5 w-3.5" />}
                    loading={updateDescription.isPending}
                    disabled={draft.trim().length < 20}
                    onClick={saveEdit}
                  >
                    Enregistrer
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<X className="h-3.5 w-3.5" />}
                    onClick={cancelEdit}
                  >
                    Annuler
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-[14px] leading-relaxed text-graphite-700">{ticket.description_raw}</p>
            )}
          </Card>

          {/* Étapes de réparation (self-service) */}
          {hasRepairSteps && (
            <Card className="mb-6 border-repair-100 bg-repair-50/40 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-repair-600" />
                <p className="label-caps text-repair-600">Étapes de réparation</p>
              </div>
              <ol className="space-y-2">
                {(diagnosisData!.repair_steps as string[]).map(
                  (step: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-graphite-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-repair-100 text-[11px] font-semibold text-repair-700">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  )
                )}
              </ol>

              {(() => {
                const warnings = diagnosisData!.safety_warnings as string[] | undefined
                if (!warnings || warnings.length === 0) return null
                return (
                  <div className="mt-4 flex items-start gap-2.5 rounded border border-alert-100 bg-alert-50 px-3.5 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-alert-500" />
                    <div>
                      <p className="label-caps text-alert-600">Précautions</p>
                      <ul className="mt-1 space-y-0.5 text-[12.5px] text-alert-600">
                        {warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  </div>
                )
              })()}
            </Card>
          )}

          {waitingDiagnosis && (
            <Card className="flex flex-col items-center gap-3 border-signal-100 bg-signal-50 p-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <Loader2 className="h-4 w-4 animate-spin text-signal-500" />
              </div>
              <div>
                <p className="font-display text-[14.5px] font-semibold text-signal-800">
                  Diagnostic IA en cours d'analyse
                </p>
                <p className="mt-1 text-[13px] text-signal-600">
                  Cela prend généralement moins de 30 secondes. Cette page se met à jour
                  automatiquement.
                </p>
              </div>
            </Card>
          )}

          {ticket.ai_diagnosis && !hasPreDiagSource && (
            <>
              <div className="mb-3 flex items-center gap-2 text-graphite-400">
                <Sparkles className="h-3.5 w-3.5" />
                <p className="label-caps">Diagnostic intelligent</p>
              </div>
              <ClientDiagnosticPanel diagnosis={ticket.ai_diagnosis} />
            </>
          )}

          {ticket.resolution_notes && (
            <Card className="mt-6 border-repair-100 bg-repair-50/40 p-5">
              <p className="label-caps mb-1.5 text-repair-600">Intervention réalisée</p>
              <p className="text-[13.5px] leading-relaxed text-graphite-700">
                {ticket.resolution_notes}
              </p>
            </Card>
          )}

          {/* Bouton escalade pour tickets self_service */}
          {isSelfService && (
            <Card className="mt-6 border-hazard-100 bg-hazard-50/40 p-5">
              <p className="text-[13.5px] text-graphite-700 mb-3">
                Les étapes n'ont pas résolu votre problème ? Un technicien peut prendre en charge votre dossier.
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={<Send className="h-3.5 w-3.5" />}
                loading={escalateTicket.isPending}
                onClick={handleEscalate}
              >
                Demander un technicien
              </Button>
              {escalateTicket.isSuccess && (
                <p className="mt-2 text-[12.5px] text-repair-600">
                  Votre dossier a été transmis à un technicien.
                </p>
              )}
            </Card>
          )}
        </div>

      </div>
    </FocusShell>
  )
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, CheckCircle2, PlayCircle, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, Spinner, PlateBadge, Field, inputClass } from '@/components/ui/primitives'
import { StatusStepper } from '@/components/StatusStepper'
import { DiagnosticPanel } from '@/components/DiagnosticPanel'
import { AIChat } from '@/components/AIChat'
import { useTicket, useUpdateTicketStatus, useAssignTicket, useCloseTicket } from '@/api/tickets'
import { useProduct } from '@/api/catalog'
import { useApp } from '@/context/AppContext'
import { PRIORITY_META } from '@/lib/status'
import { formatDateTime } from '@/lib/format'
import { ProductSchemaSection } from '@/components/ProductSchemaSection'

export default function TicketWork() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { user } = useApp()
  const { data: ticket, isLoading } = useTicket(ticketId, { poll: true })
  const { data: product } = useProduct(ticket?.product_id)
  const [showChat, setShowChat] = useState(true)
  const [showClose, setShowClose] = useState(false)
  const [notes, setNotes] = useState('')

  const updateStatus = useUpdateTicketStatus()
  const assign = useAssignTicket()
  const closeTicket = useCloseTicket()

  if (isLoading || !ticket) {
    return (
      <AppShell role="technician" title="Chargement…">
        <Spinner />
      </AppShell>
    )
  }

  const priority = PRIORITY_META[ticket.priority]
  const isAssignedToMe = ticket.assigned_technician_id === user?.id

  return (
    <AppShell
      role="technician"
      title={ticket.ticket_number}
      subtitle={product ? `${product.brand} ${product.model} · ${product.category}` : undefined}
      action={
        <div className="flex items-center gap-2">
          <PlateBadge {...priority} label={`Priorité ${priority.label}`} />
          <Button
            variant="secondary"
            size="sm"
            icon={<MessageCircle className="h-3.5 w-3.5" />}
            onClick={() => setShowChat((s) => !s)}
          >
            Assistant IA
          </Button>
        </div>
      }
    >
      <button
        onClick={() => navigate('/tech')}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-graphite-400 hover:text-graphite-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Retour aux tickets
      </button>

      <div className={`grid gap-6 ${showChat ? 'lg:grid-cols-[1fr_340px]' : ''}`}>
        <div className="space-y-5">
          <Card className="p-6">
            <StatusStepper status={ticket.status} />
          </Card>

          <Card className="p-5">
            <p className="label-caps mb-2 text-graphite-400">Description client</p>
            <p className="text-[14px] leading-relaxed text-graphite-700">
              {ticket.description_raw}
            </p>
            <p className="mt-2 text-[12px] text-graphite-400">
              Déclaré le {formatDateTime(ticket.created_at)}
            </p>
          </Card>

          {/* Actions rapides */}
          <Card className="flex flex-wrap items-center gap-2.5 p-4">
            {!ticket.assigned_technician_id && user && (
              <Button
                size="sm"
                icon={<PlayCircle className="h-3.5 w-3.5" />}
                loading={assign.isPending}
                onClick={() => assign.mutate({ ticketId: ticket.id, technicianId: user.id })}
              >
                M'assigner ce ticket
              </Button>
            )}
            {isAssignedToMe && ticket.status === 'assigned' && (
              <Button
                size="sm"
                variant="secondary"
                loading={updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate({ ticketId: ticket.id, status: 'in_progress' })
                }
              >
                Démarrer l'intervention
              </Button>
            )}
            {isAssignedToMe && ticket.status === 'in_progress' && (
              <Button
                size="sm"
                variant="secondary"
                loading={updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate({ ticketId: ticket.id, status: 'waiting_parts' })
                }
              >
                Marquer en attente de pièce
              </Button>
            )}
            {isAssignedToMe &&
              ['in_progress', 'waiting_parts', 'assigned'].includes(ticket.status) && (
                <Button
                  size="sm"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  onClick={() => setShowClose((s) => !s)}
                >
                  Clôturer le ticket
                </Button>
              )}
          </Card>

          {showClose && (
            <Card className="space-y-4 p-5">
              <Field
                label="Notes d'intervention"
                hint="Ces notes seront visibles par le client et archivées dans l'historique SAV."
              >
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Ex : Joint de porte remplacé (réf. JNT-001). Test d'étanchéité effectué. Client satisfait."
                  className={`${inputClass} resize-none`}
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowClose(false)}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  loading={closeTicket.isPending}
                  disabled={notes.trim().length < 10}
                  onClick={() =>
                    closeTicket.mutate(
                      { ticketId: ticket.id, resolutionNotes: notes.trim() },
                      { onSuccess: () => setShowClose(false) }
                    )
                  }
                >
                  Confirmer la clôture
                </Button>
              </div>
            </Card>
          )}

          {!ticket.ai_diagnosis ? (
  <Card className="flex items-center gap-3 border-signal-100 bg-signal-50 p-6">
    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-signal-500" />
    <p className="text-[13.5px] text-signal-700">
      Diagnostic IA en cours de génération…
    </p>
  </Card>
) : (
  <>
    {ticket.ai_diagnosis.recommended_parts?.length > 0 && (
      <div>
        <p className="label-caps mb-3 text-graphite-400">
          Schéma technique · pièces recommandées
        </p>
       <ProductSchemaSection
  product={product}
  recommendedParts={ticket.ai_diagnosis.recommended_parts}
  ticketId={ticket.id}
/>
      </div>
    )}
    <DiagnosticPanel diagnosis={ticket.ai_diagnosis} />
  </>
)
          }
        </div>

        {showChat && (
          <div className="h-[calc(100vh-180px)] lg:sticky lg:top-7">
            <Card className="flex h-full flex-col overflow-hidden">
              <div className="flex items-center gap-2 border-b border-graphite-100 px-5 py-3.5">
                <MessageCircle className="h-4 w-4 text-signal-500" />
                <p className="font-display text-[13.5px] font-semibold text-graphite-900">
                  Assistant technique
                </p>
              </div>
              <AIChat ticketId={ticket.id} />
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}

import { Check, Clock, Wrench, Package, CheckCircle2, XCircle, Sparkles, User } from 'lucide-react'
import type { TicketStatus } from '@/types'

interface TimelineStep {
  status: TicketStatus
  label: string
  description: string
  icon: React.ReactNode
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    status: 'open',
    label: 'Dossier créé',
    description: 'Votre demande a été enregistrée et un diagnostic IA est en cours.',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    status: 'assigned',
    label: 'Technicien assigné',
    description: 'Un technicien a été désigné pour traiter votre dossier.',
    icon: <User className="h-4 w-4" />,
  },
  {
    status: 'in_progress',
    label: 'Intervention en cours',
    description: 'Le technicien travaille activement sur votre appareil.',
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    status: 'waiting_parts',
    label: 'Attente de pièces',
    description: 'Des pièces détachées ont été commandées pour finaliser la réparation.',
    icon: <Package className="h-4 w-4" />,
  },
  {
    status: 'resolved',
    label: 'Résolu',
    description: 'Votre appareil a été réparé avec succès.',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    status: 'closed',
    label: 'Clôturé',
    description: 'Le dossier est officiellement fermé.',
    icon: <Check className="h-4 w-4" />,
  },
]

const STATUS_ORDER: TicketStatus[] = ['open', 'assigned', 'in_progress', 'waiting_parts', 'resolved', 'closed']

function getStepState(stepStatus: TicketStatus, currentStatus: TicketStatus): 'done' | 'active' | 'pending' {
  if (currentStatus === 'cancelled') return 'pending'
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  const stepIdx = STATUS_ORDER.indexOf(stepStatus)
  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

export function ClientTimeline({ status }: { status: TicketStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-alert-100 bg-alert-50 px-4 py-3.5">
        <XCircle className="h-5 w-5 shrink-0 text-alert-500" />
        <div>
          <p className="text-[13.5px] font-semibold text-alert-700">Dossier annulé</p>
          <p className="text-[12.5px] text-alert-600">Ce dossier a été annulé et ne sera pas traité.</p>
        </div>
      </div>
    )
  }

  if (status === 'self_service') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-signal-100 bg-signal-50 px-4 py-3.5">
        <Sparkles className="h-5 w-5 shrink-0 text-signal-500" />
        <div>
          <p className="text-[13.5px] font-semibold text-signal-700">Diagnostic IA en cours</p>
          <p className="text-[12.5px] text-signal-600">L'IA analyse votre panne. Résultat disponible dans quelques secondes.</p>
        </div>
      </div>
    )
  }

  // Filtrer les étapes : si waiting_parts n'est pas le statut actuel et n'a pas été atteint, on la masque
  const currentIdx = STATUS_ORDER.indexOf(status)
  const waitingIdx = STATUS_ORDER.indexOf('waiting_parts')
  const steps = TIMELINE_STEPS.filter((s) => {
    if (s.status === 'waiting_parts') {
      return currentIdx >= waitingIdx
    }
    return true
  })

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const state = getStepState(step.status, status)
        const isLast = i === steps.length - 1

        return (
          <div key={step.status} className="flex gap-4">
            {/* Colonne icône + ligne */}
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                state === 'done'
                  ? 'border-graphite-900 bg-graphite-900 text-white'
                  : state === 'active'
                  ? 'border-signal-500 bg-signal-50 text-signal-600'
                  : 'border-graphite-200 bg-white text-graphite-300'
              }`}>
                {state === 'done' ? <Check className="h-3.5 w-3.5" /> : step.icon}
              </div>
              {!isLast && (
                <div className={`mt-1 w-[2px] flex-1 min-h-[24px] rounded ${
                  state === 'done' ? 'bg-graphite-900' : 'bg-graphite-100'
                }`} />
              )}
            </div>

            {/* Contenu */}
            <div className={`pb-5 pt-1 ${isLast ? 'pb-0' : ''}`}>
              <p className={`text-[13.5px] font-semibold ${
                state === 'done' ? 'text-graphite-800'
                : state === 'active' ? 'text-signal-700'
                : 'text-graphite-300'
              }`}>
                {step.label}
                {state === 'active' && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-signal-100 px-2 py-0.5 text-[11px] font-medium text-signal-700">
                    <Clock className="h-2.5 w-2.5" /> En cours
                  </span>
                )}
              </p>
              {state !== 'pending' && (
                <p className={`mt-0.5 text-[12.5px] ${
                  state === 'active' ? 'text-signal-600' : 'text-graphite-400'
                }`}>
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

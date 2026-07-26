import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Inbox, ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Spinner, EmptyState, PlateBadge, CardHeader, Card } from '@/components/ui/primitives'
import { useApp } from '@/context/AppContext'
import { useTickets, useAssignTicket } from '@/api/tickets'
import { STATUS_META, PRIORITY_META } from '@/lib/status'
import { formatRelative } from '@/lib/format'
import type { TicketPriority, TicketStatus, TicketSummary } from '@/types'

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export default function TechDashboard() {
  const { user } = useApp()

  // File d'attente : tickets ouverts, non assignés — accessibles à tous les techniciens
  const { data: queue, isLoading: queueLoading } = useTickets({ status: 'open' })

  // Mes tickets : déjà assignés à ce technicien
  const { data: myTickets, isLoading: myLoading } = useTickets({ technician_id: user?.id })

  const [filter, setFilter] = useState<TicketStatus | 'all'>('all')

  const sortedQueue = useMemo(() => {
    if (!queue) return []
    return [...queue].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  }, [queue])

  const sortedMine = useMemo(() => {
    if (!myTickets) return []
    const filtered = filter === 'all' ? myTickets : myTickets.filter((t) => t.status === filter)
    return [...filtered].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  }, [myTickets, filter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: myTickets?.length ?? 0 }
    myTickets?.forEach((t) => {
      c[t.status] = (c[t.status] ?? 0) + 1
    })
    return c
  }, [myTickets])

  const filters: { key: TicketStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'assigned', label: 'Assignés' },
    { key: 'in_progress', label: 'En cours' },
    { key: 'waiting_parts', label: 'Attente pièce' },
    { key: 'resolved', label: 'Résolus' },
  ]

  return (
    <AppShell
      role="technician"
      title="Espace technicien"
      subtitle="File d'attente partagée et suivi de vos interventions"
    >
      {/* ── File d'attente ────────────────────────────────────────────── */}
      <Card className="mb-8">
        <CardHeader
          title="File d'attente"
          subtitle="Tickets nécessitant un technicien, non encore assignés — triés par priorité IA"
        />
        {queueLoading && <Spinner label="Chargement de la file…" />}
        {!queueLoading && sortedQueue.length === 0 && (
          <div className="p-5">
            <EmptyState
              icon={<Inbox className="h-5 w-5" />}
              title="File d'attente vide"
              description="Aucun ticket en attente d'un technicien pour le moment."
            />
          </div>
        )}
        {sortedQueue.length > 0 && (
          <div className="divide-y divide-graphite-50">
            {sortedQueue.map((t) => (
              <QueueRow key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </Card>

      {/* ── Mes tickets ───────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[15px] font-semibold text-graphite-900">Mes tickets</h2>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                filter === f.key
                  ? 'bg-graphite-900 text-white'
                  : 'bg-white text-graphite-500 hover:bg-graphite-100'
              }`}
            >
              {f.label}
              {counts[f.key] !== undefined && (
                <span className="ml-1.5 text-graphite-300">{counts[f.key]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {myLoading && <Spinner label="Chargement de vos tickets…" />}

      {!myLoading && sortedMine.length === 0 && (
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title="Aucun ticket ici"
          description="Prenez un ticket dans la file d'attente pour commencer."
        />
      )}

      {sortedMine.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-graphite-100 bg-white shadow-panel">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-graphite-100 bg-graphite-50/60">
                <th className="label-caps px-5 py-3 text-graphite-400">Ticket</th>
                <th className="label-caps px-5 py-3 text-graphite-400">Statut</th>
                <th className="label-caps px-5 py-3 text-graphite-400">Priorité</th>
                <th className="label-caps px-5 py-3 text-graphite-400">Déclaré</th>
              </tr>
            </thead>
            <tbody>
              {sortedMine.map((t) => {
                const status = STATUS_META[t.status]
                const priority = PRIORITY_META[t.priority]
                return (
                  <tr
                    key={t.id}
                    className="border-b border-graphite-50 last:border-0 hover:bg-graphite-50/60"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/tech/tickets/${t.id}`}
                        className="font-mono text-[13px] font-medium text-graphite-800 hover:text-signal-600"
                      >
                        {t.ticket_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <PlateBadge {...status} label={status.label} />
                    </td>
                    <td className="px-5 py-3.5">
                      <PlateBadge {...priority} label={priority.label} />
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px] text-graphite-400">
                      {formatRelative(t.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}

function QueueRow({ ticket }: { ticket: TicketSummary }) {
  const { user } = useApp()
  const navigate = useNavigate()
  const assign = useAssignTicket()
  const priority = PRIORITY_META[ticket.priority]

  const takeCharge = () => {
    if (!user) return
    assign.mutate(
      { ticketId: ticket.id, technicianId: user.id },
      { onSuccess: () => navigate(`/tech/tickets/${ticket.id}`) }
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[13px] font-medium text-graphite-800">
          {ticket.ticket_number}
        </span>
        <PlateBadge {...priority} label={priority.label} />
        <span className="text-[12px] text-graphite-400">
          {formatRelative(ticket.created_at)}
        </span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        loading={assign.isPending}
        icon={<ArrowRight className="h-3.5 w-3.5" />}
        onClick={takeCharge}
      >
        Prendre en charge
      </Button>
    </div>
  )
}
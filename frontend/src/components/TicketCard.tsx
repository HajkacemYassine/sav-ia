import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { TicketSummary } from '@/types'
import { PlateBadge } from './ui/primitives'
import { STATUS_META, PRIORITY_META } from '@/lib/status'
import { formatRelative } from '@/lib/format'

export function TicketCard({ ticket, to }: { ticket: TicketSummary; to: string }) {
  const status = STATUS_META[ticket.status]
  const priority = PRIORITY_META[ticket.priority]

  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-4 rounded-lg border border-graphite-100 bg-white px-5 py-4 shadow-panel transition-all hover:border-graphite-200 hover:shadow-raised"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[13px] font-medium text-graphite-800">
            {ticket.ticket_number}
          </span>
          <PlateBadge {...status} label={status.label} />
          {(ticket.priority === 'high' || ticket.priority === 'critical') && (
            <PlateBadge {...priority} label={priority.label} />
          )}
        </div>
        <p className="mt-1.5 text-[12.5px] text-graphite-400">
          Déclaré {formatRelative(ticket.created_at)}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-graphite-300 transition-transform group-hover:translate-x-0.5 group-hover:text-graphite-500" />
    </Link>
  )
}

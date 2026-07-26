import { Check } from 'lucide-react'
import type { TicketStatus } from '@/types'
import { STATUS_FLOW, STATUS_META } from '@/lib/status'

export function StatusStepper({ status }: { status: TicketStatus }) {
  if (status === 'self_service') {
    const meta = STATUS_META.self_service
    return (
      <div className="rounded border bg-white px-4 py-3 text-[13px]">
        <span className="font-medium">{meta.label}</span> — en attente de votre diagnostic.
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="rounded border border-alert-100 bg-alert-50 px-4 py-3 text-[13px] text-alert-600">
        Ce ticket a été annulé.
      </div>
    )
  }

  const currentIndex = STATUS_FLOW.indexOf(status)

  return (
    <div className="flex items-center">
      {STATUS_FLOW.map((step, i) => {
        const meta = STATUS_META[step]
        const done = i < currentIndex
        const active = i === currentIndex
        const isLast = i === STATUS_FLOW.length - 1

        return (
          <div key={step} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-colors ${
                  done
                    ? 'border-graphite-900 bg-graphite-900 text-white'
                    : active
                    ? `border-signal-500 bg-white text-signal-600`
                    : 'border-graphite-200 bg-white text-graphite-300'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`whitespace-nowrap text-[11px] font-medium ${
                  active ? 'text-signal-700' : done ? 'text-graphite-700' : 'text-graphite-300'
                }`}
              >
                {meta.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mx-1.5 mb-4 h-[2px] flex-1 rounded ${
                  done ? 'bg-graphite-900' : 'bg-graphite-100'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

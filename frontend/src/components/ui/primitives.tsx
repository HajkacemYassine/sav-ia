import type { HTMLAttributes, ReactNode } from 'react'
import { Loader2, Inbox } from 'lucide-react'

// ── Card ─────────────────────────────────────────────────────────────────
export function Card({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-graphite-100 bg-white shadow-panel ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-graphite-100 px-5 py-4">
      <div>
        <h3 className="font-display text-[15px] font-semibold text-graphite-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-graphite-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Rating-plate style badge (signature detail) ─────────────────────────
export function PlateBadge({
  dot,
  text,
  bg,
  border,
  label,
}: {
  dot: string
  text: string
  bg: string
  border: string
  label: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 label-caps ${bg} ${text} ${border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────
export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-graphite-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <p className="text-[13px]">{label}</p>
    </div>
  )
}

// ── EmptyState ───────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-graphite-200 px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-graphite-100 text-graphite-400">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <div>
        <p className="font-display text-[15px] font-semibold text-graphite-800">{title}</p>
        {description && <p className="mt-1 text-[13px] text-graphite-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Field wrapper ────────────────────────────────────────────────────────
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-graphite-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-[12px] text-graphite-400">{hint}</span>}
      {error && <span className="mt-1.5 block text-[12px] text-alert-500">{error}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded border border-graphite-200 bg-white px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-graphite-300 outline-none transition-shadow focus:border-signal-400 focus:shadow-focus'

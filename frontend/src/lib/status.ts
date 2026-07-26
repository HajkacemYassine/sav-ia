import type { TicketPriority, TicketSeverity, TicketStatus } from '@/types'

interface Meta {
  label: string
  dot: string
  text: string
  bg: string
  border: string
}

export const STATUS_META: Record<TicketStatus, Meta> = {
  self_service: {
    label: 'Auto-diagnostic',
    dot: 'bg-signal-400',
    text: 'text-signal-600',
    bg: 'bg-signal-50',
    border: 'border-signal-100',
  },
  open: {
    label: 'En attente technicien',
    dot: 'bg-signal-500',
    text: 'text-signal-700',
    bg: 'bg-signal-50',
    border: 'border-signal-100',
  },
  assigned: {
    label: 'Assigné',
    dot: 'bg-hazard-500',
    text: 'text-hazard-600',
    bg: 'bg-hazard-50',
    border: 'border-hazard-100',
  },
  in_progress: {
    label: 'En cours',
    dot: 'bg-hazard-500',
    text: 'text-hazard-600',
    bg: 'bg-hazard-50',
    border: 'border-hazard-100',
  },
  waiting_parts: {
    label: 'Attente pièce',
    dot: 'bg-graphite-400',
    text: 'text-graphite-600',
    bg: 'bg-graphite-100',
    border: 'border-graphite-200',
  },
  resolved: {
    label: 'Résolu',
    dot: 'bg-repair-500',
    text: 'text-repair-600',
    bg: 'bg-repair-50',
    border: 'border-repair-100',
  },
  closed: {
    label: 'Clôturé',
    dot: 'bg-graphite-400',
    text: 'text-graphite-500',
    bg: 'bg-graphite-50',
    border: 'border-graphite-100',
  },
  cancelled: {
    label: 'Annulé',
    dot: 'bg-alert-500',
    text: 'text-alert-600',
    bg: 'bg-alert-50',
    border: 'border-alert-100',
  },
}

export const PRIORITY_META: Record<TicketPriority, Meta> = {
  low: {
    label: 'Basse',
    dot: 'bg-graphite-400',
    text: 'text-graphite-500',
    bg: 'bg-graphite-50',
    border: 'border-graphite-100',
  },
  medium: {
    label: 'Moyenne',
    dot: 'bg-signal-500',
    text: 'text-signal-700',
    bg: 'bg-signal-50',
    border: 'border-signal-100',
  },
  high: {
    label: 'Haute',
    dot: 'bg-hazard-500',
    text: 'text-hazard-600',
    bg: 'bg-hazard-50',
    border: 'border-hazard-100',
  },
  critical: {
    label: 'Critique',
    dot: 'bg-alert-500',
    text: 'text-alert-600',
    bg: 'bg-alert-50',
    border: 'border-alert-100',
  },
}

export const SEVERITY_META: Record<TicketSeverity, Meta> = {
  low: PRIORITY_META.low,
  medium: PRIORITY_META.medium,
  high: PRIORITY_META.high,
  critical: PRIORITY_META.critical,
}

export const STATUS_FLOW: TicketStatus[] = [
  'self_service',
  'open',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
]

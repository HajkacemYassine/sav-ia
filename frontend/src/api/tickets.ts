import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Ticket, TicketSummary, TicketCreatePayload, TicketStatus } from '@/types'

interface TicketFilters {
  status?: TicketStatus
  priority?: string
  client_id?: string
  technician_id?: string
}

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      if (filters.technician_id) {
        const { data } = await api.get<TicketSummary[]>(
          `/technicians/${filters.technician_id}/tickets`
        )
        return data
      }
      const params: Record<string, string> = {}
      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority
      if (filters.client_id) params.client_id = filters.client_id
      const { data } = await api.get<TicketSummary[]>('/tickets/', { params })
      return data
    },
  })
}

export function useClientTickets(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-tickets', clientId],
    queryFn: async () => {
      const { data } = await api.get<TicketSummary[]>(`/clients/${clientId}/tickets`)
      return data
    },
    enabled: !!clientId,
  })
}

export function useTicket(ticketId: string | undefined, opts?: { poll?: boolean }) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const { data } = await api.get<Ticket>(`/tickets/${ticketId}`)
      return data
    },
    enabled: !!ticketId,
    refetchInterval: opts?.poll ? 4000 : false,
  })
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TicketCreatePayload) => {
      const { data } = await api.post<Ticket>('/tickets/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['client-tickets'] })
    },
  })
}

export function useUpdateTicketDescription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, description }: { ticketId: string; description: string }) => {
      const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/description`, {
        description_raw: description,
      })
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ticket', data.id] })
    },
  })
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
      const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/status`, { status })
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ticket', data.id] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useAssignTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      ticketId,
      technicianId,
    }: {
      ticketId: string
      technicianId: string
    }) => {
      const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/assign`, {
        technician_id: technicianId,
      })
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ticket', data.id] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useCloseTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      ticketId,
      resolutionNotes,
    }: {
      ticketId: string
      resolutionNotes: string
    }) => {
      const { data } = await api.post<Ticket>(`/tickets/${ticketId}/close`, {
        resolution_notes: resolutionNotes,
      })
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ticket', data.id] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useEscalateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data } = await api.post<Ticket>(`/tickets/${ticketId}/escalate`)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ticket', data.id] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['client-tickets'] })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { PartOrder } from '@/types'

export function useTicketPartOrders(ticketId: string | undefined) {
  return useQuery({
    queryKey: ['part-orders', ticketId],
    queryFn: async () => {
      const { data } = await api.get<PartOrder[]>(`/part-orders/ticket/${ticketId}`)
      return data
    },
    enabled: !!ticketId,
  })
}

export function useCreatePartOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      ticket_id: string
      spare_part_id: string
      technician_id?: string
      quantity?: number
    }) => {
      const { data } = await api.post<PartOrder>('/part-orders/', payload)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['part-orders', data.ticket_id] })
    },
  })
}
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { ChatResponse } from '@/types'

export interface PreDiagChatResponse {
  done: boolean
  question: string | null
  needs_technician: boolean | null
  summary: string | null
  guide_id: string | null
  guide_number: string | null
  repair_steps?: string[]
  safety_warnings?: string[]
}

export function usePreDiagChat() {
  return useMutation({
    mutationFn: async (payload: {
      clientId: string
      productId: string
      invoiceId?: string
      productLabel: string
      description: string
      messages: { role: 'user' | 'assistant'; content: string }[]
    }) => {
      const { data } = await api.post<PreDiagChatResponse>('/ai/pre-diagnostic-chat', {
        client_id: payload.clientId,
        product_id: payload.productId,
        invoice_id: payload.invoiceId ?? null,
        product_label: payload.productLabel,
        description: payload.description,
        messages: payload.messages,
      })
      return data
    },
  })
}

export function useDiagnose() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data } = await api.post('/ai/diagnose', { ticket_id: ticketId })
      return data
    },
    onSuccess: (_data, ticketId) => {
      qc.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })
}

export function useAIChat() {
  return useMutation({
    mutationFn: async ({ ticketId, message, history }: { ticketId: string; message: string; history: { role: string; content: string }[] }) => {
      const { data } = await api.post<ChatResponse>('/ai/chat', {
        ticket_id: ticketId,
        message,
        history,
      })
      return data
    },
  })
}

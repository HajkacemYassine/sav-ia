import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { RepairGuide, RepairGuideSummary } from '@/types'

export function useClientGuides(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-guides', clientId],
    queryFn: async () => {
      const { data } = await api.get<RepairGuideSummary[]>('/repair-guides/', {
        params: { client_id: clientId },
      })
      return data
    },
    enabled: !!clientId,
  })
}

export function useRepairGuide(guideId: string | undefined) {
  return useQuery({
    queryKey: ['repair-guide', guideId],
    queryFn: async () => {
      const { data } = await api.get<RepairGuide>(`/repair-guides/${guideId}`)
      return data
    },
    enabled: !!guideId,
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { AdminStats, IndexingJob, QdrantCollection } from '@/types'

//fonction pour récupérer la liste des collections de documents
export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data } = await api.get<{ collections: QdrantCollection[] }>(
        '/admin/documents/collections'
      )
      return data.collections
    },
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get<AdminStats>('/admin/stats')
      return data
    },
  })
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: async (payload: {
      file: File
      collection_name: string
      product_id?: string
      brand?: string
      model?: string
      category?: string
    }) => {
      const formData = new FormData()
      formData.append('file', payload.file)

      const params: Record<string, string> = { collection_name: payload.collection_name }
      if (payload.product_id) params.product_id = payload.product_id
      if (payload.brand) params.brand = payload.brand
      if (payload.model) params.model = payload.model
      if (payload.category) params.category = payload.category

      const { data } = await api.post('/admin/documents/upload', formData, {
        params,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data as { job_id: string; status: string; message: string }
    },
  })
}

export function useJobStatus(jobId: string | undefined, poll: boolean) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const { data } = await api.get<IndexingJob>(`/admin/documents/jobs/${jobId}`)
      return data
    },
    enabled: !!jobId,
    refetchInterval: poll ? 1500 : false,
  })
}
export function useUploadProductSchema() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post(`/admin/products/${productId}/schema-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data as { status: string; schema_image_url: string }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  AdminLookupResponse,
  Client,
  Invoice,
  Product,
  SparePart,
  Technician,
  WarrantyStatus,
} from '@/types'

// ── Clients ──────────────────────────────────────────────────────────────
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get<Client[]>('/clients/')
      return data
    },
  })
}

export function useClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data } = await api.get<Client>(`/clients/${clientId}`)
      return data
    },
    enabled: !!clientId,
  })
}

export function useLookupClient() {
  return useMutation({
    mutationFn: async (payload: { email?: string; invoice_number?: string }) => {
      const { data } = await api.post<Client>('/clients/lookup', payload)
      return data
    },
  })
}

export function useLookupTechnician() {
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      const { data } = await api.post<Technician>('/technicians/lookup', payload)
      return data
    },
  })
}

export function useLookupAdmin() {
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      const { data } = await api.post<AdminLookupResponse>('/admin/lookup', payload)
      return data
    },
  })
}

export function useCreateClient() {
  return useMutation({
    mutationFn: async (payload: {
      full_name: string
      email: string
      phone?: string
      address?: string
    }) => {
      const { data } = await api.post<Client>('/clients/', payload)
      return data
    },
  })
}

export function useClientInvoices(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-invoices', clientId],
    queryFn: async () => {
      const { data } = await api.get<Invoice[]>(`/clients/${clientId}/invoices`)
      return data
    },
    enabled: !!clientId,
  })
}

// ── Produits ─────────────────────────────────────────────────────────────
export function useProducts(filters: { brand?: string; category?: string } = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const { data } = await api.get<Product[]>('/products/', { params: filters })
      return data
    },
  })
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data } = await api.get<Product>(`/products/${productId}`)
      return data
    },
    enabled: !!productId,
  })
}

export function useProductSpareParts(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-spare-parts', productId],
    queryFn: async () => {
      const { data } = await api.get<SparePart[]>(`/products/${productId}/spare-parts`)
      return data
    },
    enabled: !!productId,
  })
}

// ── Pièces détachées ─────────────────────────────────────────────────────
export function useSpareParts(filters: { in_stock?: boolean } = {}) {
  return useQuery({
    queryKey: ['spare-parts', filters],
    queryFn: async () => {
      const { data } = await api.get<SparePart[]>('/spare-parts/', { params: filters })
      return data
    },
  })
}

// ── Techniciens ──────────────────────────────────────────────────────────
export function useTechnicians(filters: { available?: boolean } = {}) {
  return useQuery({
    queryKey: ['technicians', filters],
    queryFn: async () => {
      const { data } = await api.get<Technician[]>('/technicians/', { params: filters })
      return data
    },
  })
}

export function useCreateTechnician() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      full_name: string
      email: string
      speciality?: string
      is_available?: boolean
    }) => {
      const { data } = await api.post<Technician>('/technicians/', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['technicians'] }),
  })
}

export function useUpdateTechnicianAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const { data } = await api.patch<Technician>(`/technicians/${id}/availability`, {
        is_available: isAvailable,
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['technicians'] }),
  })
}

export function useDeleteTechnician() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/technicians/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['technicians'] }),
  })
}

// ── Garantie ─────────────────────────────────────────────────────────────
export function useWarrantyStatus(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['warranty', invoiceId],
    queryFn: async () => {
      const { data } = await api.get<WarrantyStatus>(`/invoices/${invoiceId}/warranty-status`)
      return data
    },
    enabled: !!invoiceId,
    retry: false,
  })
}
// ── Rôles applicatifs ────────────────────────────────────────────────────
export type UserRole = 'client' | 'technician' | 'admin'

// ── Client ───────────────────────────────────────────────────────────────
export interface Client {
  id: string
  full_name: string
  email: string
  phone?: string | null
  address?: string | null
}

// ── Facture ──────────────────────────────────────────────────────────────
export interface Invoice {
  id: string
  invoice_number: string
  purchase_date: string
  warranty_end_date: string
  products: {
    id: string
    brand: string
    model: string
    category: string
  }[]
}

// ── Produit ──────────────────────────────────────────────────────────────
export interface Product {
  id: string
  brand: string
  model: string
  category: string
  repairable: boolean
  avg_repair_cost?: number | null
  schema_image_url?: string | null
}

// ── Pièce détachée ───────────────────────────────────────────────────────
export interface SparePart {
  id: string
  reference: string
  name: string
  price: number
  stock_quantity: number
  supplier_id?: string | null
}

export interface RecommendedPart {
  part_id: string
  reference: string
  name: string
  price: number
  in_stock: boolean
  stock_quantity: number
  relevance_score: number
}

// ── Technicien ───────────────────────────────────────────────────────────
export interface Technician {
  id: string
  full_name: string
  email: string
  speciality?: string | null
  is_available: boolean
}

export interface AdminLookupResponse {
  id: string
  email: string
  label: string
}

export interface CountStat {
  key: string
  count: number
}

export interface AdminStats {
  total_tickets: number
  open_tickets: number
  critical_tickets: number
  resolved_tickets: number
  resolution_rate: number
  waiting_parts: number
  out_of_warranty: number
  average_repair_cost: number
  repairable_tickets: number
  non_repairable_tickets: number
  part_orders_count: number
  status_counts: CountStat[]
  priority_counts: CountStat[]
}

// ── Diagnostic IA ────────────────────────────────────────────────────────
export interface ProbableCause {
  cause: string
  probability: number
  explanation?: string
}

export interface Solution {
  step: number
  action: string
  duration_minutes?: number
}

export interface Repairability {
  recommendation: 'repair' | 'replace'
  reason: string
  repair_cost_estimate: number
  replacement_cost_estimate: number
  cost_ratio: number
  economic_score: number
  additional_advice?: string
}

export interface ExtractedEntities {
  product_type: string
  brand?: string | null
  model?: string | null
  symptoms: string[]
  severity: TicketSeverity
  urgency: 'urgent' | 'normal' | 'low'
  estimated_age_years?: number | null
}

export type TicketSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AIDiagnosis {
  ticket_id?: string
  ticket_number?: string
  warranty_valid?: boolean
  extracted_entities: ExtractedEntities
  probable_causes: ProbableCause[]
  solutions: Solution[]
  spare_parts_needed: string[]
  recommended_parts: RecommendedPart[]
  severity: TicketSeverity
  is_repairable: boolean
  confidence_score: number
  technician_notes?: string
  safety_warnings: string[]
  estimated_repair_cost: number
  repairability?: Repairability
  processing_time_ms: number
  product_info?: {
    brand?: string | null
    model?: string | null
    category?: string | null
    repairable: boolean
  }
}

// ── Ticket SAV ───────────────────────────────────────────────────────────
export type TicketStatus =
  | 'self_service'
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'waiting_parts'
  | 'resolved'
  | 'closed'
  | 'cancelled'

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface TicketSummary {
  id: string
  ticket_number: string
  status: TicketStatus
  priority: TicketPriority
  created_at: string
}

export interface Ticket {
  id: string
  ticket_number: string
  status: TicketStatus
  priority: TicketPriority
  client_id: string
  product_id: string
  invoice_id?: string | null
  assigned_technician_id?: string | null
  description_raw: string
  ai_diagnosis?: AIDiagnosis | null
  conversation_history?: ChatMessage[] | null
  resolution_notes?: string | null
  created_at: string
  resolved_at?: string | null
}

export interface TicketCreatePayload {
  client_id: string
  product_id: string
  invoice_id?: string | null
  description_raw: string
}

// ── Garantie ─────────────────────────────────────────────────────────────
export interface WarrantyStatus {
  is_valid: boolean
  warranty_end_date: string
  days_remaining: number
  message: string
}

// ── Chat IA ──────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  ticket_id: string
  question: string
  answer: string
}

// ── Admin / Indexation ───────────────────────────────────────────────────
export interface IndexingJob {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  message?: string
  result?: {
    status: string
    chunks_indexed: number
    collection: string
    source_file: string
  }
  error?: string
}

export interface QdrantCollection {
  name: string
}
// ── Commandes de pièces ──────────────────────────────────────────────────
export interface PartOrder {
  id: string
  ticket_id: string
  spare_part_id: string
  technician_id?: string | null
  quantity: number
  status: 'ordered' | 'received'
  ordered_at: string
  part_reference?: string | null
  part_name?: string | null
}

// ── Guide de réparation (self-service) ───────────────────────────────────
export interface RepairGuide {
  id: string
  guide_number: string
  client_id: string
  product_id: string
  summary: string
  repair_steps: string[]
  safety_warnings: string[]
  conversation_history?: ChatMessage[] | null
  created_at: string
}

export interface RepairGuideSummary {
  id: string
  guide_number: string
  summary: string
  created_at: string
}
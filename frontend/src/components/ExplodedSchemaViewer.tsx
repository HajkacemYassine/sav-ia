import { useMemo, useState } from 'react'
import { PackageCheck, PackageX, ShoppingCart, Check, Sparkles } from 'lucide-react'
import type { RecommendedPart } from '@/types'
import { formatCurrency } from '@/lib/format'
import { useCreatePartOrder, useTicketPartOrders } from '@/api/partOrders'
import { useApp } from '@/context/AppContext'
import { Button } from './ui/Button'
 
type IconKind = 'ring' | 'pcb' | 'gear' | 'coil' | 'canister' | 'fan' | 'dial' | 'cylinder' | 'bolt'
 
interface Zone {
  id: string
  label: string
  keywords: string[]
  icon: IconKind
}
 
const ZONES_BY_CATEGORY: Record<'washer' | 'fridge' | 'generic', Zone[]> = {
  washer: [
    { id: 'door_seal', label: 'Joint de porte', keywords: ['joint', 'étanchéité', 'porte'], icon: 'ring' },
    { id: 'control_board', label: 'Carte électronique', keywords: ['carte', 'électronique', 'pcb', 'contrôleur', 'module'], icon: 'pcb' },
    { id: 'motor_belt', label: 'Moteur / Courroie', keywords: ['moteur', 'courroie', 'transmission', 'poulie'], icon: 'gear' },
    { id: 'pump', label: 'Pompe de vidange', keywords: ['pompe', 'vidange'], icon: 'cylinder' },
    { id: 'heating', label: 'Résistance', keywords: ['résistance', 'resistance', 'chauffe'], icon: 'coil' },
    { id: 'other', label: 'Autre pièce', keywords: [], icon: 'bolt' },
  ],
  fridge: [
    { id: 'door_seal', label: 'Joint de porte', keywords: ['joint', 'étanchéité', 'porte'], icon: 'ring' },
    { id: 'thermostat', label: 'Thermostat', keywords: ['thermostat', 'capteur', 'température', 'sonde'], icon: 'dial' },
    { id: 'compressor', label: 'Compresseur', keywords: ['compresseur'], icon: 'canister' },
    { id: 'fan', label: 'Ventilateur', keywords: ['ventilateur'], icon: 'fan' },
    { id: 'other', label: 'Autre pièce', keywords: [], icon: 'bolt' },
  ],
  generic: [
    { id: 'control_board', label: 'Carte électronique', keywords: ['carte', 'électronique', 'pcb', 'module'], icon: 'pcb' },
    { id: 'motor_pump', label: 'Moteur / Pompe', keywords: ['moteur', 'pompe'], icon: 'gear' },
    { id: 'seal', label: 'Joint / Étanchéité', keywords: ['joint', 'étanchéité'], icon: 'ring' },
    { id: 'other', label: 'Autre pièce', keywords: [], icon: 'bolt' },
  ],
}
 
function detectCategory(productCategory: string | undefined): 'washer' | 'fridge' | 'generic' {
  const c = (productCategory ?? '').toLowerCase()
  if (c.includes('lave') && !c.includes('vaisselle')) return 'washer'
  if (c.includes('frigo') || c.includes('réfrig') || c.includes('refrig') || c.includes('congél')) return 'fridge'
  return 'generic'
}
 
function matchZone(partName: string, zones: Zone[]): Zone {
  const name = partName.toLowerCase()
  return zones.find((z) => z.keywords.some((k) => name.includes(k))) ?? zones[zones.length - 1]
}
 
interface MappedHotspot {
  zone: Zone
  part: RecommendedPart
  iconPos: [number, number]
  anchor: [number, number]
  above: boolean
}
 
const VB_W = 620
const VB_H = 330
const AXIS_Y = 165
const AXIS_X0 = 90
const AXIS_X1 = VB_W - 90
const ICON_SIZE = 46
 
function layoutHotspots(count: number): { anchor: [number, number]; icon: [number, number]; above: boolean }[] {
  return Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0.5 : i / (count - 1)
    const x = AXIS_X0 + t * (AXIS_X1 - AXIS_X0)
    const above = i % 2 === 0
    return {
      anchor: [x, AXIS_Y] as [number, number],
      icon: [x, above ? 78 : 252] as [number, number],
      above,
    }
  })
}
 
export function ExplodedSchemaViewer({
  category,
  recommendedParts,
  ticketId,
}: {
  category: string | undefined
  recommendedParts: RecommendedPart[]
  ticketId: string
}) {
  const { user } = useApp()
  const kind = detectCategory(category)
  const zones = ZONES_BY_CATEGORY[kind]
  const createOrder = useCreatePartOrder()
  const { data: orders } = useTicketPartOrders(ticketId)
 
  const matched = useMemo(() => {
    const byZone = new Map<string, { zone: Zone; part: RecommendedPart }>()
    for (const part of recommendedParts) {
      const zone = matchZone(part.name, zones)
      const existing = byZone.get(zone.id)
      if (!existing || part.relevance_score > existing.part.relevance_score) {
        byZone.set(zone.id, { zone, part })
      }
    }
    return Array.from(byZone.values()).sort((a, b) => b.part.relevance_score - a.part.relevance_score)
  }, [recommendedParts, zones])
 
  const positions = useMemo(() => layoutHotspots(matched.length), [matched.length])
 
  const hotspots: MappedHotspot[] = matched.map((m, i) => ({
    ...m,
    anchor: positions[i].anchor,
    iconPos: positions[i].icon,
    above: positions[i].above,
  }))
 
  const [selectedId, setSelectedId] = useState<string | null>(hotspots[0]?.part.part_id ?? null)
  const selected = hotspots.find((h) => h.part.part_id === selectedId) ?? hotspots[0]
  const orderedPartIds = new Set((orders ?? []).map((o) => o.spare_part_id))
 
  if (hotspots.length === 0) {
    return null
  }
 
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      {/* Schéma éclaté */}
      <div className="rounded-lg border border-graphite-100 bg-white p-4 shadow-panel">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" role="img" aria-label="Schéma éclaté de l'appareil">
          {/* Axe d'assemblage */}
          <line x1={AXIS_X0 - 20} y1={AXIS_Y} x2={AXIS_X1 + 20} y2={AXIS_Y} stroke="#C7CBD2" strokeWidth={2} />
          {hotspots.map((h) => (
            <circle key={`node-${h.zone.id}`} cx={h.anchor[0]} cy={h.anchor[1]} r={3} fill="#727A87" />
          ))}
 
          {hotspots.map((h, i) => {
            const isSelected = selected?.part.part_id === h.part.part_id
            const isTop = i === 0
            const ordered = orderedPartIds.has(h.part.part_id)
            const numY = h.above ? h.iconPos[1] - ICON_SIZE / 2 - 22 : h.iconPos[1] + ICON_SIZE / 2 + 22
            const labelY = h.above ? h.iconPos[1] - ICON_SIZE / 2 - 40 : h.iconPos[1] + ICON_SIZE / 2 + 40
 
            return (
              <g key={h.zone.id}>
                {/* leader line */}
                <line
                  x1={h.anchor[0]}
                  y1={h.anchor[1]}
                  x2={h.iconPos[0]}
                  y2={h.iconPos[1] + (h.above ? ICON_SIZE / 2 - 2 : -(ICON_SIZE / 2 - 2))}
                  stroke={isSelected ? '#3358F4' : '#C7CBD2'}
                  strokeWidth={1.25}
                  strokeDasharray="3 3"
                />
 
                <g
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(h.part.part_id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedId(h.part.part_id)}
                  className="cursor-pointer outline-none"
                >
                  {isTop && !ordered && (
                    <circle cx={h.iconPos[0]} cy={h.iconPos[1]} r={ICON_SIZE / 2 + 6} fill="none" stroke="#3358F4" strokeWidth={1.5} opacity={0.3}>
                      <animate attributeName="r" values={`${ICON_SIZE / 2 + 6};${ICON_SIZE / 2 + 14};${ICON_SIZE / 2 + 6}`} dur="2.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0;0.3" dur="2.2s" repeatCount="indefinite" />
                    </circle>
                  )}
 
                  {/* fond de la pièce technique */}
                  <circle
                    cx={h.iconPos[0]}
                    cy={h.iconPos[1]}
                    r={ICON_SIZE / 2}
                    fill={isSelected ? '#EEF2FF' : '#FAFAFA'}
                    stroke={isSelected ? '#3358F4' : '#D8DCE2'}
                    strokeWidth={isSelected ? 1.75 : 1.25}
                  />
                  <PartIcon kind={h.zone.icon} x={h.iconPos[0]} y={h.iconPos[1]} s={ICON_SIZE * 0.72} />
 
                  {/* badge numéroté */}
                  <circle
                    cx={h.iconPos[0]}
                    cy={numY}
                    r={10}
                    fill={ordered ? '#158F63' : isSelected ? '#3358F4' : '#1F242C'}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  <text x={h.iconPos[0]} y={numY + 3.5} textAnchor="middle" fontSize={10} fontFamily="IBM Plex Mono, monospace" fill="#FFFFFF" fontWeight={600}>
                    {ordered ? '✓' : i + 1}
                  </text>
 
                  <text
                    x={h.iconPos[0]}
                    y={labelY}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily="Inter, sans-serif"
                    fontWeight={isSelected ? 600 : 500}
                    fill={isSelected ? '#1D37AD' : '#3D4451'}
                  >
                    {h.zone.label}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
        <p className="mt-1 text-center text-[11.5px] text-graphite-400">
          Schéma éclaté généré · pièces génériques par type — cliquez pour détailler
        </p>
      </div>
 
      {/* Détail de la pièce sélectionnée */}
      <div className="space-y-3">
        {hotspots.map((h, i) => {
          if (selected?.part.part_id !== h.part.part_id) return null
          const ordered = orderedPartIds.has(h.part.part_id)
          return (
            <div key={h.part.part_id} className="rounded-lg border border-signal-100 bg-signal-50/40 p-4">
              {i === 0 && (
                <div className="mb-2 flex items-center gap-1.5 text-signal-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="label-caps">Pièce la plus probable</span>
                </div>
              )}
              <p className="font-mono text-[11.5px] text-graphite-400">{h.part.reference}</p>
              <p className="mt-0.5 text-[14.5px] font-semibold text-graphite-900">{h.part.name}</p>
              <p className="mt-1 text-[12px] text-graphite-500">{h.zone.label}</p>
 
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[16px] font-semibold text-graphite-900">{formatCurrency(h.part.price)}</span>
                <span className={`flex items-center gap-1 text-[12px] ${h.part.in_stock ? 'text-repair-600' : 'text-alert-500'}`}>
                  {h.part.in_stock ? <PackageCheck className="h-3.5 w-3.5" /> : <PackageX className="h-3.5 w-3.5" />}
                  {h.part.in_stock ? `${h.part.stock_quantity} en stock` : 'Rupture de stock'}
                </span>
              </div>
 
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-graphite-100">
                <div className="h-full rounded-full bg-signal-500" style={{ width: `${h.part.relevance_score * 100}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-graphite-400">
                Pertinence diagnostic : {Math.round(h.part.relevance_score * 100)}%
              </p>
 
              <Button
                className="mt-4 w-full"
                size="sm"
                disabled={ordered}
                loading={createOrder.isPending && createOrder.variables?.spare_part_id === h.part.part_id}
                icon={ordered ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                onClick={() =>
                  createOrder.mutate({
                    ticket_id: ticketId,
                    spare_part_id: h.part.part_id,
                    technician_id: user?.id,
                    quantity: 1,
                  })
                }
              >
                {ordered ? 'Pièce commandée' : 'Commander cette pièce'}
              </Button>
            </div>
          )
        })}
 
        {hotspots.length > 1 && (
          <div className="rounded-lg border border-graphite-100 bg-white p-3">
            <p className="label-caps mb-2 px-1 text-graphite-400">Autres pièces détectées</p>
            <div className="space-y-1">
              {hotspots.map((h, i) => (
                <button
                  key={h.part.part_id}
                  onClick={() => setSelectedId(h.part.part_id)}
                  className={`flex w-full items-center gap-2.5 rounded px-2 py-2 text-left transition-colors ${
                    selected?.part.part_id === h.part.part_id ? 'bg-signal-50' : 'hover:bg-graphite-50'
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-graphite-900 font-mono text-[10px] text-white">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-graphite-700">{h.part.name}</span>
                  {orderedPartIds.has(h.part.part_id) && <Check className="h-3.5 w-3.5 shrink-0 text-repair-500" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
 
// ── Icônes techniques génériques (style ligne, esprit "schéma éclaté") ────
function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (Math.PI * 2 * i) / 6
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
  }
  return pts.join(' ')
}
 
function PartIcon({ kind, x, y, s }: { kind: IconKind; x: number; y: number; s: number }) {
  const stroke = '#5B6472'
  const sw = 1.6
 
  switch (kind) {
    case 'ring':
      return (
        <g>
          <circle cx={x} cy={y} r={s * 0.5} fill="none" stroke={stroke} strokeWidth={sw} />
          <circle cx={x} cy={y} r={s * 0.27} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray="2 2" />
        </g>
      )
 
    case 'pcb':
      return (
        <g>
          <rect x={x - s * 0.5} y={y - s * 0.36} width={s} height={s * 0.72} rx={3} fill="#FFFFFF" stroke={stroke} strokeWidth={sw} />
          <rect x={x - s * 0.18} y={y - s * 0.12} width={s * 0.36} height={s * 0.24} fill="none" stroke={stroke} strokeWidth={1.1} />
          <circle cx={x - s * 0.34} cy={y - s * 0.2} r={1.8} fill={stroke} />
          <circle cx={x + s * 0.34} cy={y - s * 0.2} r={1.8} fill={stroke} />
          <circle cx={x - s * 0.34} cy={y + s * 0.2} r={1.8} fill={stroke} />
          <circle cx={x + s * 0.34} cy={y + s * 0.2} r={1.8} fill={stroke} />
        </g>
      )
 
    case 'gear': {
      const teeth = 8
      const rOuter = s * 0.5
      const rInner = s * 0.37
      const rHole = s * 0.16
      const pts: string[] = []
      for (let i = 0; i < teeth * 2; i++) {
        const a = (Math.PI * 2 * i) / (teeth * 2)
        const r = i % 2 === 0 ? rOuter : rInner
        pts.push(`${x + r * Math.cos(a)},${y + r * Math.sin(a)}`)
      }
      return (
        <g>
          <polygon points={pts.join(' ')} fill="#FFFFFF" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx={x} cy={y} r={rHole} fill="none" stroke={stroke} strokeWidth={sw} />
        </g>
      )
    }
 
    case 'coil': {
      const segs = 6
      const amp = s * 0.2
      const stepX = (s * 0.85) / segs
      let d = `M ${x - s * 0.42} ${y}`
      for (let i = 1; i <= segs; i++) {
        d += ` L ${x - s * 0.42 + stepX * i} ${y + (i % 2 === 0 ? amp : -amp)}`
      }
      return (
        <g>
          <rect x={x - s * 0.5} y={y - s * 0.36} width={s} height={s * 0.72} rx={4} fill="#FFFFFF" stroke={stroke} strokeWidth={sw} />
          <path d={d} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    }
 
    case 'canister':
      return (
        <g>
          <rect x={x - s * 0.3} y={y - s * 0.5} width={s * 0.6} height={s} rx={s * 0.16} fill="#FFFFFF" stroke={stroke} strokeWidth={sw} />
          <line x1={x - s * 0.3} y1={y - s * 0.14} x2={x + s * 0.3} y2={y - s * 0.14} stroke={stroke} strokeWidth={1} />
          <circle cx={x - s * 0.15} cy={y + s * 0.4} r={1.8} fill={stroke} />
          <circle cx={x + s * 0.15} cy={y + s * 0.4} r={1.8} fill={stroke} />
        </g>
      )
 
    case 'fan': {
      const blades = 4
      const els = []
      for (let i = 0; i < blades; i++) {
        const a = (Math.PI * 2 * i) / blades
        const x2 = x + s * 0.46 * Math.cos(a)
        const y2 = y + s * 0.46 * Math.sin(a)
        const xp = x + s * 0.18 * Math.cos(a + 0.6)
        const yp = y + s * 0.18 * Math.sin(a + 0.6)
        els.push(
          <path key={i} d={`M ${x} ${y} Q ${xp} ${yp} ${x2} ${y2}`} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        )
      }
      return (
        <g>
          {els}
          <circle cx={x} cy={y} r={s * 0.11} fill={stroke} />
        </g>
      )
    }
 
    case 'dial':
      return (
        <g>
          <circle cx={x} cy={y} r={s * 0.5} fill="#FFFFFF" stroke={stroke} strokeWidth={sw} />
          <line x1={x} y1={y} x2={x + s * 0.26} y2={y - s * 0.18} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <circle cx={x} cy={y} r={1.6} fill={stroke} />
        </g>
      )
 
    case 'cylinder':
      return (
        <g>
          <rect x={x - s * 0.22} y={y - s * 0.5} width={s * 0.44} height={s} rx={s * 0.1} fill="#FFFFFF" stroke={stroke} strokeWidth={sw} />
          <line x1={x - s * 0.22} y1={y - s * 0.1} x2={x + s * 0.22} y2={y - s * 0.1} stroke={stroke} strokeWidth={1} />
          <rect x={x + s * 0.22 - 1} y={y - 3} width={s * 0.14} height={6} fill="#FFFFFF" stroke={stroke} strokeWidth={1} />
        </g>
      )
 
    default: // bolt
      return (
        <g>
          <polygon points={hexPoints(x, y, s * 0.42)} fill="#FFFFFF" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx={x} cy={y} r={s * 0.16} fill="none" stroke={stroke} strokeWidth={sw} />
        </g>
      )
  }
}
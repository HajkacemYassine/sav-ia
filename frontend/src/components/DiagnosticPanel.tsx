import {
  AlertTriangle,
  Wrench,
  PackageCheck,
  PackageX,
  ShieldAlert,
  Timer,
  ArrowRightLeft,
} from 'lucide-react'
import type { AIDiagnosis } from '@/types'
import { DiagnosticGauge } from './DiagnosticGauge'
import { Card, CardHeader } from './ui/primitives'
import { formatCurrency } from '@/lib/format'
import { SEVERITY_META } from '@/lib/status'

export function DiagnosticPanel({ diagnosis }: { diagnosis: AIDiagnosis }) {
  const severity = SEVERITY_META[diagnosis.severity]

  return (
    <div className="space-y-5">
      {/* Bandeau instrument : jauge + synthèse */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <DiagnosticGauge value={diagnosis.confidence_score} />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`label-caps rounded-sm border px-2 py-0.5 ${severity.bg} ${severity.text} ${severity.border}`}>
                Sévérité {severity.label}
              </span>
              {diagnosis.warranty_valid !== undefined && (
                <span
                  className={`label-caps rounded-sm border px-2 py-0.5 ${
                    diagnosis.warranty_valid
                      ? 'border-repair-100 bg-repair-50 text-repair-600'
                      : 'border-graphite-200 bg-graphite-50 text-graphite-500'
                  }`}
                >
                  {diagnosis.warranty_valid ? 'Sous garantie' : 'Hors garantie'}
                </span>
              )}
              <span className="label-caps flex items-center gap-1 rounded-sm border border-graphite-100 bg-graphite-50 px-2 py-0.5 text-graphite-500">
                <Timer className="h-3 w-3" />
                {(diagnosis.processing_time_ms / 1000).toFixed(1)}s
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-graphite-600">
              {diagnosis.extracted_entities.product_type}
              {diagnosis.extracted_entities.brand ? ` · ${diagnosis.extracted_entities.brand}` : ''}
              {diagnosis.extracted_entities.model ? ` ${diagnosis.extracted_entities.model}` : ''}
              {' — '}
              {diagnosis.extracted_entities.symptoms.join(', ')}
            </p>
          </div>
        </div>
      </Card>

      {diagnosis.safety_warnings?.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-alert-100 bg-alert-50 px-4 py-3.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-alert-500" />
          <div>
            <p className="label-caps text-alert-600">Avertissement sécurité</p>
            <ul className="mt-1 space-y-0.5 text-[13.5px] text-alert-600">
              {diagnosis.safety_warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Causes probables */}
        <Card>
          <CardHeader title="Causes probables" subtitle="Classées par probabilité estimée" />
          <div className="divide-y divide-graphite-50 px-5 py-2">
            {diagnosis.probable_causes.map((cause, i) => (
              <div key={i} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13.5px] font-medium text-graphite-800">{cause.cause}</p>
                  <span className="shrink-0 font-mono text-[12.5px] text-graphite-500">
                    {Math.round(cause.probability * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-graphite-100">
                  <div
                    className="h-full rounded-full bg-signal-500"
                    style={{ width: `${cause.probability * 100}%` }}
                  />
                </div>
                {cause.explanation && (
                  <p className="mt-1.5 text-[12.5px] text-graphite-400">{cause.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Solutions */}
        <Card>
          <CardHeader title="Procédure recommandée" subtitle={`${diagnosis.solutions.length} étapes`} />
          <ol className="space-y-3.5 px-5 py-4">
            {diagnosis.solutions.map((sol) => (
              <li key={sol.step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-graphite-900 font-mono text-[11px] font-medium text-white">
                  {sol.step}
                </span>
                <div className="flex-1 pt-0.5">
                  <p className="text-[13.5px] text-graphite-700">{sol.action}</p>
                  {sol.duration_minutes !== undefined && sol.duration_minutes !== null && (
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-graphite-400">
                      <Timer className="h-3 w-3" /> ~{sol.duration_minutes} min
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* Pièces recommandées */}
      {diagnosis.recommended_parts?.length > 0 && (
        <Card>
          <CardHeader
            title="Pièces détachées recommandées"
            subtitle="Triées par pertinence avec le diagnostic"
          />
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {diagnosis.recommended_parts.map((part) => (
              <div
                key={part.part_id}
                className="rounded border border-graphite-100 bg-porcelain px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-[12px] text-graphite-400">{part.reference}</p>
                  {part.in_stock ? (
                    <PackageCheck className="h-3.5 w-3.5 shrink-0 text-repair-500" />
                  ) : (
                    <PackageX className="h-3.5 w-3.5 shrink-0 text-alert-400" />
                  )}
                </div>
                <p className="mt-1 text-[13.5px] font-medium text-graphite-800">{part.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-graphite-900">
                    {formatCurrency(part.price)}
                  </span>
                  <span
                    className={`text-[11.5px] ${
                      part.in_stock ? 'text-repair-600' : 'text-alert-500'
                    }`}
                  >
                    {part.in_stock ? `${part.stock_quantity} en stock` : 'Rupture'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Réparabilité */}
      {diagnosis.repairability && (
        <Card
          className={
            diagnosis.repairability.recommendation === 'repair'
              ? 'border-repair-100'
              : 'border-hazard-100'
          }
        >
          <div className="flex items-start gap-4 p-5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                diagnosis.repairability.recommendation === 'repair'
                  ? 'bg-repair-50 text-repair-600'
                  : 'bg-hazard-50 text-hazard-600'
              }`}
            >
              {diagnosis.repairability.recommendation === 'repair' ? (
                <Wrench className="h-[18px] w-[18px]" />
              ) : (
                <ArrowRightLeft className="h-[18px] w-[18px]" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-display text-[15px] font-semibold text-graphite-900">
                {diagnosis.repairability.recommendation === 'repair'
                  ? 'Réparation recommandée'
                  : 'Remplacement recommandé'}
              </p>
              <p className="mt-1 text-[13.5px] text-graphite-600">
                {diagnosis.repairability.reason}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[12.5px] text-graphite-500">
                <span>
                  Coût réparation :{' '}
                  <span className="font-mono font-medium text-graphite-800">
                    {formatCurrency(diagnosis.repairability.repair_cost_estimate)}
                  </span>
                </span>
                <span>
                  Valeur remplacement :{' '}
                  <span className="font-mono font-medium text-graphite-800">
                    {formatCurrency(diagnosis.repairability.replacement_cost_estimate)}
                  </span>
                </span>
              </div>
              {diagnosis.repairability.additional_advice && (
                <p className="mt-2 flex items-start gap-1.5 text-[12.5px] text-graphite-400">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  {diagnosis.repairability.additional_advice}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {diagnosis.technician_notes && (
        <Card className="border-graphite-100 bg-graphite-50/40">
          <div className="p-5">
            <p className="label-caps mb-1.5 text-graphite-400">Notes pour le technicien</p>
            <p className="text-[13.5px] text-graphite-600">{diagnosis.technician_notes}</p>
          </div>
        </Card>
      )}
    </div>
  )
}

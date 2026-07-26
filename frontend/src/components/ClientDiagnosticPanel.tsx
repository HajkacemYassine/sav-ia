import { Wrench, ArrowRightLeft, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { AIDiagnosis } from '@/types'
import { Card } from './ui/primitives'

const SEVERITY_LABEL: Record<string, { label: string; className: string }> = {
  low:      { label: 'Panne mineure',    className: 'bg-repair-50 text-repair-700 border-repair-100' },
  medium:   { label: 'Panne modérée',   className: 'bg-hazard-50 text-hazard-700 border-hazard-100' },
  high:     { label: 'Panne importante', className: 'bg-alert-50 text-alert-700 border-alert-100' },
  critical: { label: 'Panne critique',  className: 'bg-alert-50 text-alert-700 border-alert-100' },
}

export function ClientDiagnosticPanel({ diagnosis }: { diagnosis: AIDiagnosis }) {
  const sev = SEVERITY_LABEL[diagnosis.severity] ?? SEVERITY_LABEL.medium
  const isRepair = diagnosis.repairability?.recommendation === 'repair'

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`label-caps rounded border px-2 py-0.5 ${sev.className}`}>
            {sev.label}
          </span>
          {diagnosis.warranty_valid !== undefined && (
            <span className={`label-caps flex items-center gap-1 rounded border px-2 py-0.5 ${
              diagnosis.warranty_valid
                ? 'border-repair-100 bg-repair-50 text-repair-600'
                : 'border-graphite-200 bg-graphite-50 text-graphite-500'
            }`}>
              {diagnosis.warranty_valid
                ? <><ShieldCheck className="h-3 w-3" /> Sous garantie</>
                : <><ShieldAlert className="h-3 w-3" /> Hors garantie</>}
            </span>
          )}
        </div>
        <p className="text-[14px] leading-relaxed text-graphite-700">
          {diagnosis.extracted_entities.symptoms.join(', ')}
        </p>
      </Card>

      {/* Cause principale */}
      {diagnosis.probable_causes?.length > 0 && (
        <Card className="p-5">
          <p className="label-caps mb-2 text-graphite-400">Cause probable</p>
          <p className="text-[14px] font-medium text-graphite-800">
            {diagnosis.probable_causes[0].cause}
          </p>
          {diagnosis.probable_causes[0].explanation && (
            <p className="mt-1 text-[13px] text-graphite-500">
              {diagnosis.probable_causes[0].explanation}
            </p>
          )}
        </Card>
      )}

      {/* Avertissement sécurité */}
      {diagnosis.safety_warnings?.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-alert-100 bg-alert-50 px-4 py-3.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-alert-500" />
          <div>
            <p className="label-caps text-alert-600">Avertissement</p>
            <ul className="mt-1 space-y-0.5 text-[13px] text-alert-600">
              {diagnosis.safety_warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Recommandation */}
      {diagnosis.repairability && (
        <Card className={isRepair ? 'border-repair-100' : 'border-hazard-100'}>
          <div className="flex items-start gap-4 p-5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isRepair ? 'bg-repair-50 text-repair-600' : 'bg-hazard-50 text-hazard-600'
            }`}>
              {isRepair ? <Wrench className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
            </div>
            <div>
              <p className="font-display text-[14.5px] font-semibold text-graphite-900">
                {isRepair ? 'Réparation recommandée' : 'Remplacement recommandé'}
              </p>
              <p className="mt-1 text-[13px] text-graphite-600">
                {diagnosis.repairability.reason}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

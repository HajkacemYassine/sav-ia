import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Wrench, AlertTriangle, Sparkles } from 'lucide-react'
import { FocusShell } from '@/components/layout/FocusShell'
import { Spinner, Card } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { useRepairGuide } from '@/api/repairGuides'
import { useProduct } from '@/api/catalog'
import { formatDateTime } from '@/lib/format'

export default function GuideDetail() {
  const { guideId } = useParams()
  const navigate = useNavigate()
  const { data: guide, isLoading } = useRepairGuide(guideId)
  const { data: product } = useProduct(guide?.product_id)

  if (isLoading || !guide) {
    return (
      <FocusShell width="max-w-3xl">
        <Spinner label="Chargement du guide…" />
      </FocusShell>
    )
  }

  return (
    <FocusShell width="max-w-4xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          icon={<ArrowLeft className="h-3.5 w-3.5" />}
          onClick={() => navigate('/client')}
        >
          Mes dossiers
        </Button>
      </div>

      <div className="grid gap-6">
        <div>
          <div className="mb-6">
            <div className="flex items-center gap-2.5">
              <h1 className="font-mono text-lg font-semibold text-graphite-900">
                {guide.guide_number}
              </h1>
              <span className="label-caps rounded border border-repair-100 bg-repair-50 px-2 py-0.5 text-repair-600">
                Auto-réparation
              </span>
            </div>
            <p className="mt-1 text-[13px] text-graphite-400">
              Créé le {formatDateTime(guide.created_at)}
              {product && ` · ${product.brand} ${product.model}`}
            </p>
          </div>

          {/* Résumé */}
          <Card className="mb-6 p-5">
            <p className="label-caps mb-2 text-graphite-400">Résumé</p>
            <p className="text-[14px] leading-relaxed text-graphite-700">{guide.summary}</p>
          </Card>

          {/* Étapes de réparation */}
          {guide.repair_steps.length > 0 && (
            <Card className="mb-6 border-repair-100 bg-repair-50/40 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-repair-600" />
                <p className="label-caps text-repair-600">Étapes de réparation</p>
              </div>
              <ol className="space-y-3">
                {guide.repair_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-graphite-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-repair-100 text-[11px] font-semibold text-repair-700">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {/* Avertissements sécurité */}
          {guide.safety_warnings.length > 0 && (
            <Card className="mb-6 border-alert-100 bg-alert-50/40 p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-alert-500" />
                <p className="label-caps text-alert-600">Précautions importantes</p>
              </div>
              <ul className="space-y-1.5">
                {guide.safety_warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-alert-600">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-alert-400" />
                    {w}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Conseil */}
          <Card className="border-graphite-100 bg-porcelain p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-signal-500" />
              <div>
                <p className="text-[13.5px] font-medium text-graphite-700">
                  Besoin d'un technicien ?
                </p>
                <p className="mt-1 text-[13px] text-graphite-500">
                  Si ces étapes ne résolvent pas votre problème, vous pouvez créer un dossier SAV
                  depuis la page "Déclarer une panne" pour qu'un technicien prenne en charge votre
                  appareil.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </FocusShell>
  )
}

import type { Product, RecommendedPart } from '@/types'
import { ExplodedSchemaViewer } from './ExplodedSchemaViewer'
import { Card } from './ui/primitives'

/**
 * Affiche le schéma technique d'un produit pour le technicien.
 *
 * - Si le produit a une vraie image de schéma uploadée par l'admin
 *   (product.schema_image_url) → on l'affiche telle quelle, avec la
 *   pièce recommandée indiquée en légende (pas de zones cliquables sur
 *   une image réelle, contrairement au schéma générique).
 * - Sinon → schéma interactif générique par catégorie (ExplodedSchemaViewer).
 */
export function ProductSchemaSection({
  product,
  recommendedParts,
  ticketId,
}: {
  product: Product | undefined
  recommendedParts: RecommendedPart[]
  ticketId: string
}) {
  if (recommendedParts.length === 0) {
    return null
  }

  if (product?.schema_image_url) {
    const topPart = [...recommendedParts].sort((a, b) => b.relevance_score - a.relevance_score)[0]
    return (
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-graphite-100 px-5 py-3.5">
          <p className="font-display text-[13.5px] font-semibold text-graphite-900">
            Schéma technique constructeur — {product.brand} {product.model}
          </p>
          <span className="label-caps rounded-sm border border-signal-100 bg-signal-50 px-2 py-0.5 text-signal-700">
            Document réel
          </span>
        </div>
        <div className="flex justify-center bg-graphite-50/40 p-4">
          <img
            src={product.schema_image_url}
            alt={`Schéma technique ${product.brand} ${product.model}`}
            className="max-h-[520px] w-auto rounded border border-graphite-100 bg-white object-contain"
          />
        </div>
        <div className="border-t border-graphite-100 bg-signal-50/40 px-5 py-3.5">
          <p className="text-[12.5px] text-graphite-600">
            <span className="font-semibold text-signal-700">Pièce recommandée à repérer sur le plan : </span>
            {topPart.name}{' '}
            <span className="font-mono text-graphite-400">({topPart.reference})</span>
          </p>
        </div>
      </Card>
    )
  }

  return (
    <ExplodedSchemaViewer
      category={product?.category}
      recommendedParts={recommendedParts}
      ticketId={ticketId}
    />
  )
}
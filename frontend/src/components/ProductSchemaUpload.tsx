import { useRef, useState } from 'react'
import { ImagePlus, Check } from 'lucide-react'
import { useProducts } from '@/api/catalog'
import { useUploadProductSchema } from '@/api/admin'
import { Button } from './ui/Button'
import { Card } from './ui/primitives'

export function ProductSchemaUpload() {
  const { data: products } = useProducts()
  const upload = useUploadProductSchema()
  const fileRef = useRef<HTMLInputElement>(null)

  const [productId, setProductId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [justUploaded, setJustUploaded] = useState(false)

  const submit = () => {
    if (!productId || !file) return
    upload.mutate(
      { productId, file },
      {
        onSuccess: () => {
          setJustUploaded(true)
          setFile(null)
          if (fileRef.current) fileRef.current.value = ''
          setTimeout(() => setJustUploaded(false), 3000)
        },
      }
    )
  }

  return (
    <Card>
      <div className="border-b border-graphite-100 px-5 py-4">
        <p className="font-display text-[15px] font-semibold text-graphite-900">
          Schéma technique constructeur
        </p>
        <p className="mt-0.5 text-[13px] text-graphite-500">
          Uploader une vraie image de schéma pour un produit précis — affichée en
          priorité sur le schéma générique pour ce produit
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-graphite-700">
            Produit concerné
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded border border-graphite-200 bg-white px-3.5 py-2.5 text-[14px] text-graphite-800 outline-none focus:border-signal-400"
          >
            <option value="">— Choisir un produit —</option>
            {products?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.brand} {p.model} ({p.category})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-graphite-700">
            Image du schéma (PNG/JPG)
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-2 rounded border border-dashed border-graphite-200 px-4 py-8 text-center transition-colors hover:border-signal-300 hover:bg-signal-50/30"
          >
            <ImagePlus className="h-5 w-5 text-graphite-400" />
            <p className="text-[12.5px] text-graphite-500">
              {file ? file.name : 'Cliquer pour choisir une image'}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button
          className="w-full"
          disabled={!productId || !file}
          loading={upload.isPending}
          icon={justUploaded ? <Check className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
          onClick={submit}
        >
          {justUploaded ? 'Schéma associé au produit' : 'Associer ce schéma au produit'}
        </Button>
        {upload.isError && (
          <p className="text-[12.5px] text-alert-500">{upload.error?.message}</p>
        )}
      </div>
    </Card>
  )
}
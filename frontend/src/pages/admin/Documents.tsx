import { useRef, useState } from 'react'
import { UploadCloud, FileText, CheckCircle2, XCircle, Loader2, Database } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, Field, inputClass } from '@/components/ui/primitives'
import { useCollections, useUploadDocument, useJobStatus } from '@/api/admin'
import { ProductSchemaUpload } from '@/components/ProductSchemaUpload'

const COLLECTION_LABELS: Record<string, string> = {
  technical_manuals: 'Manuels techniques',
  repair_procedures: 'Procédures de réparation',
  faq_knowledge_base: 'FAQ',
  sav_history: 'Historique SAV',
  technical_schemas: 'Schémas techniques',
}

interface UploadEntry {
  jobId: string
  fileName: string
}

export default function AdminDocuments() {
  const { data: collections } = useCollections()
  const upload = useUploadDocument()
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [collectionName, setCollectionName] = useState('technical_manuals')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [entries, setEntries] = useState<UploadEntry[]>([])

  const submit = () => {
    if (!file) return
    upload.mutate(
      {
        file,
        collection_name: collectionName,
        brand: brand || undefined,
        category: category || undefined,
      },
      {
        onSuccess: (data) => {
          setEntries((prev) => [{ jobId: data.job_id, fileName: file.name }, ...prev])
          setFile(null)
          if (fileRef.current) fileRef.current.value = ''
        },
      }
    )
  }

  return (
    <AppShell
      role="admin"
      title="Base documentaire"
      subtitle="Alimente le moteur RAG utilisé par les agents IA"
    >
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader title="Indexer un document" subtitle="PDF ou texte technique" />
          <div className="space-y-4 p-5">
            <Field label="Collection cible">
              <select
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className={inputClass}
              >
                {(collections?.map((c) => c.name) ?? Object.keys(COLLECTION_LABELS)).map(
                  (name) => (
                    <option key={name} value={name}>
                      {COLLECTION_LABELS[name] ?? name}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Fichier" hint="Formats acceptés : .pdf, .txt">
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-2 rounded border border-dashed border-graphite-200 px-4 py-8 text-center transition-colors hover:border-signal-300 hover:bg-signal-50/30"
              >
                <UploadCloud className="h-5 w-5 text-graphite-400" />
                <p className="text-[12.5px] text-graphite-500">
                  {file ? file.name : 'Cliquer pour choisir un fichier'}
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Marque" hint="Optionnel">
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Samsung"
                  className={inputClass}
                />
              </Field>
              <Field label="Catégorie" hint="Optionnel">
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="lave-linge"
                  className={inputClass}
                />
              </Field>
            </div>

            <Button
              className="w-full"
              disabled={!file}
              loading={upload.isPending}
              icon={<UploadCloud className="h-4 w-4" />}
              onClick={submit}
            >
              Lancer l'indexation
            </Button>
            {upload.isError && (
              <p className="text-[12.5px] text-alert-500">{(upload.error as Error).message}</p>
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Collections Qdrant"
              subtitle="Bases vectorielles utilisées par le RAG"
            />
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
              {(collections ?? Object.keys(COLLECTION_LABELS).map((name) => ({ name }))).map(
                (c) => (
                  <div
                    key={c.name}
                    className="flex items-center gap-2.5 rounded border border-graphite-100 bg-porcelain px-3.5 py-3"
                  >
                    <Database className="h-4 w-4 shrink-0 text-signal-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-graphite-800">
                        {COLLECTION_LABELS[c.name] ?? c.name}
                      </p>
                      <p className="truncate font-mono text-[11px] text-graphite-400">
                        {c.name}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </Card>

          <ProductSchemaUpload />

          <Card>
            <CardHeader title="Indexations récentes" subtitle="Suivi des tâches en arrière-plan" />
            <div className="divide-y divide-graphite-50">
              {entries.length === 0 && (
                <p className="px-5 py-8 text-center text-[13px] text-graphite-400">
                  Aucune indexation lancée pour l'instant.
                </p>
              )}
              {entries.map((entry) => (
                <JobRow key={entry.jobId} jobId={entry.jobId} fileName={entry.fileName} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

function JobRow({ jobId, fileName }: { jobId: string; fileName: string }) {
  const { data: job } = useJobStatus(jobId, true)
  const status = job?.status ?? 'queued'

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <FileText className="h-4 w-4 shrink-0 text-graphite-400" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-graphite-800">{fileName}</p>
          {job?.result && (
            <p className="text-[11.5px] text-graphite-400">
              {job.result.chunks_indexed} segments indexés
            </p>
          )}
          {job?.error && <p className="text-[11.5px] text-alert-500">{job.error}</p>}
        </div>
      </div>
      <StatusPill status={status} />
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="flex items-center gap-1 text-[12px] font-medium text-repair-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> Indexé
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="flex items-center gap-1 text-[12px] font-medium text-alert-500">
        <XCircle className="h-3.5 w-3.5" /> Échec
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-[12px] font-medium text-signal-600">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> En cours
    </span>
  )
}

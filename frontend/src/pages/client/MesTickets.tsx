import { Link } from 'react-router-dom'
import { Plus, FileQuestion, FileText, Package, Calendar, ShieldCheck, ShieldAlert, Wrench } from 'lucide-react'
import { FocusShell } from '@/components/layout/FocusShell'
import { Button } from '@/components/ui/Button'
import { Spinner, EmptyState, Card } from '@/components/ui/primitives'
import { TicketCard } from '@/components/TicketCard'
import { useApp } from '@/context/AppContext'
import { useClientTickets } from '@/api/tickets'
import { useClientGuides } from '@/api/repairGuides'
import { useClientInvoices } from '@/api/catalog'
import { formatDateTime } from '@/lib/format'

export default function MesTickets() {
  const { user } = useApp()
  const { data: invoices } = useClientInvoices(user?.id)
  const selectedInvoice = invoices?.find((inv) => inv.id === user?.invoiceId)
  const { data: tickets, isLoading: loadingTickets } = useClientTickets(user?.id)
  const { data: guides, isLoading: loadingGuides } = useClientGuides(user?.id)

  const today = new Date()
  const warrantyValid = selectedInvoice
    ? new Date(selectedInvoice.warranty_end_date) >= today
    : null

  const isLoading = loadingTickets || loadingGuides

  return (
    <FocusShell width="max-w-3xl">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-graphite-900">Mes dossiers SAV</h1>
          <p className="mt-1 text-[13.5px] text-graphite-500">
            Bonjour {user?.label?.split(' ')[0]}, suivez vos déclarations de panne ici.
          </p>
        </div>
        <Link to="/client/new">
          <Button icon={<Plus className="h-4 w-4" />}>Déclarer une panne</Button>
        </Link>
      </div>

      {selectedInvoice && (
        <Card className="mb-6 p-4">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-signal-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13.5px] font-semibold text-graphite-900">
                  {selectedInvoice.invoice_number}
                </p>
                {warrantyValid !== null && (
                  <span className={`label-caps flex items-center gap-1 rounded border px-2 py-0.5 ${
                    warrantyValid
                      ? 'border-repair-100 bg-repair-50 text-repair-600'
                      : 'border-graphite-200 bg-graphite-50 text-graphite-500'
                  }`}>
                    {warrantyValid
                      ? <><ShieldCheck className="h-3 w-3" /> Sous garantie</>
                      : <><ShieldAlert className="h-3 w-3" /> Hors garantie</>}
                  </span>
                )}
              </div>
              {selectedInvoice.products.length > 0 && (
                <p className="mt-1 flex items-center gap-1 text-[13px] text-graphite-600">
                  <Package className="h-3 w-3" />
                  {selectedInvoice.products.map(p => `${p.brand} ${p.model}`).join(' · ')}
                </p>
              )}
              <p className="mt-0.5 flex items-center gap-1 text-[12px] text-graphite-400">
                <Calendar className="h-3 w-3" />
                Achat : {selectedInvoice.purchase_date} · Garantie jusqu'au {selectedInvoice.warranty_end_date}
              </p>
            </div>
          </div>
        </Card>
      )}

      {isLoading && <Spinner label="Chargement de vos dossiers…" />}

      {/* Guides de réparation */}
      {!loadingGuides && guides && guides.length > 0 && (
        <div className="mb-6">
          <p className="label-caps mb-3 text-graphite-400">Guides de réparation</p>
          <div className="space-y-2.5">
            {guides.map((g) => (
              <Link
                key={g.id}
                to={`/client/guides/${g.id}`}
                className="flex items-center justify-between rounded border border-repair-100 bg-repair-50/40 px-4 py-3 transition-colors hover:border-repair-200 hover:bg-repair-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-repair-100">
                    <Wrench className="h-3.5 w-3.5 text-repair-600" />
                  </div>
                  <div>
                    <p className="font-mono text-[13px] font-semibold text-graphite-800">
                      {g.guide_number}
                    </p>
                    <p className="text-[12.5px] text-graphite-500">{g.summary}</p>
                  </div>
                </div>
                <p className="text-[11px] text-graphite-400">
                  {formatDateTime(g.created_at)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tickets SAV */}
      {!loadingTickets && tickets && tickets.length > 0 && (
        <div>
          <p className="label-caps mb-3 text-graphite-400">Dossiers techniques</p>
          <div className="space-y-2.5">
            {tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} to={`/client/tickets/${t.id}`} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && (!tickets || tickets.length === 0) && (!guides || guides.length === 0) && (
        <EmptyState
          icon={<FileQuestion className="h-5 w-5" />}
          title="Aucun dossier pour le moment"
          description="Déclarez une panne pour obtenir un diagnostic instantané."
          action={
            <Link to="/client/new">
              <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                Déclarer une panne
              </Button>
            </Link>
          }
        />
      )}
    </FocusShell>
  )
}

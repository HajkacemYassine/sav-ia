import { useState } from 'react'
import { UserPlus, Trash2, Wrench, Mail } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, Field, inputClass, Spinner, EmptyState } from '@/components/ui/primitives'
import {
  useTechnicians,
  useCreateTechnician,
  useUpdateTechnicianAvailability,
  useDeleteTechnician,
} from '@/api/catalog'
import { initials } from '@/lib/format'
import type { Technician } from '@/types'
 
export default function AdminTechnicians() {
  const { data: technicians, isLoading } = useTechnicians()
  const [showForm, setShowForm] = useState(false)
 
  return (
    <AppShell
      role="admin"
      title="Techniciens"
      subtitle="Gère l'équipe SAV disponible pour l'assignation des tickets"
      action={
        <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowForm((s) => !s)}>
          Ajouter un technicien
        </Button>
      }
    >
      {showForm && <CreateForm onDone={() => setShowForm(false)} />}
 
      <Card>
        <CardHeader
          title="Équipe"
          subtitle={technicians ? `${technicians.length} technicien(s) enregistré(s)` : undefined}
        />
        {isLoading && <Spinner label="Chargement de l'équipe…" />}
 
        {!isLoading && technicians?.length === 0 && (
          <div className="p-5">
            <EmptyState
              icon={<Wrench className="h-5 w-5" />}
              title="Aucun technicien enregistré"
              description="Ajoute ton premier technicien pour pouvoir assigner des tickets."
              action={
                <Button size="sm" icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setShowForm(true)}>
                  Ajouter un technicien
                </Button>
              }
            />
          </div>
        )}
 
        <div className="divide-y divide-graphite-50">
          {technicians?.map((t) => (
            <TechnicianRow key={t.id} technician={t} />
          ))}
        </div>
      </Card>
    </AppShell>
  )
}
 
function CreateForm({ onDone }: { onDone: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [speciality, setSpeciality] = useState('')
  const create = useCreateTechnician()
 
  const submit = () => {
    if (!fullName.trim() || !email.trim()) return
    create.mutate(
      { full_name: fullName.trim(), email: email.trim(), speciality: speciality.trim() || undefined },
      {
        onSuccess: () => {
          setFullName('')
          setEmail('')
          setSpeciality('')
          onDone()
        },
      }
    )
  }
 
  return (
    <Card className="mb-5 p-5">
      <p className="label-caps mb-4 text-graphite-400">Nouveau technicien</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Nom complet">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Karim Belaïd"
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="karim.belaid@sav-ia.local"
            className={inputClass}
          />
        </Field>
        <Field label="Spécialité" hint="Optionnel">
          <input
            value={speciality}
            onChange={(e) => setSpeciality(e.target.value)}
            placeholder="Électroménager"
            className={inputClass}
          />
        </Field>
      </div>
      {create.isError && (
        <p className="mt-3 text-[12.5px] text-alert-500">{(create.error as Error).message}</p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Annuler
        </Button>
        <Button
          size="sm"
          loading={create.isPending}
          disabled={!fullName.trim() || !email.trim()}
          onClick={submit}
        >
          Créer
        </Button>
      </div>
    </Card>
  )
}
 
function TechnicianRow({ technician }: { technician: Technician }) {
  const toggleAvailability = useUpdateTechnicianAvailability()
  const deleteTechnician = useDeleteTechnician()
 
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-graphite-100 text-[12px] font-semibold text-graphite-600">
          {initials(technician.full_name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium text-graphite-800">
            {technician.full_name}
          </p>
          <div className="flex items-center gap-1 text-[12px] text-graphite-400">
            <Mail className="h-3 w-3" />
            <span className="truncate">{technician.email}</span>
          </div>
        </div>
      </div>
 
      <div className="flex shrink-0 items-center gap-3">
        {technician.speciality && (
          <span className="hidden text-[12px] text-graphite-400 sm:inline">
            {technician.speciality}
          </span>
        )}
 
        <button
          onClick={() =>
            toggleAvailability.mutate({ id: technician.id, isAvailable: !technician.is_available })
          }
          className={`label-caps flex items-center gap-1.5 rounded-sm border px-2 py-0.5 transition-colors ${
            technician.is_available
              ? 'border-repair-100 bg-repair-50 text-repair-600 hover:bg-repair-100'
              : 'border-graphite-200 bg-graphite-50 text-graphite-500 hover:bg-graphite-100'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              technician.is_available ? 'bg-repair-500' : 'bg-graphite-400'
            }`}
          />
          {technician.is_available ? 'Disponible' : 'Indisponible'}
        </button>
 
        <button
          onClick={() => {
            if (confirm(`Supprimer ${technician.full_name} ?`)) {
              deleteTechnician.mutate(technician.id)
            }
          }}
          className="flex h-7 w-7 items-center justify-center rounded text-graphite-300 hover:bg-alert-50 hover:text-alert-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
 
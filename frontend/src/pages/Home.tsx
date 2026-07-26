import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, UserRound, Wrench, ShieldCheck, ChevronRight, FileText, Calendar, Package, Check } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { api } from '@/api/client'
import type { UserRole } from '@/types'
import type { Client, Invoice } from '@/types'
import { useClientInvoices } from '@/api/catalog'

type Step = 'role' | 'login' | 'register' | 'invoices'
type Mode = 'client' | 'technician' | 'admin' | null

export default function Home() {
  const [step, setStep] = useState<Step>('role')
  const [mode, setMode] = useState<Mode>(null)
  const { user, isLoading } = useApp()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-porcelain">
        <p className="text-sm text-graphite-400">Chargement…</p>
      </div>
    )
  }

  if (user) {
    if (user.role === 'client' && step !== 'invoices') navigate('/client', { replace: true })
    else if (user.role === 'technician') navigate('/tech', { replace: true })
    else if (user.role === 'admin') navigate('/admin', { replace: true })
    if (step !== 'invoices') return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-porcelain px-6 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-graphite-900">
            <Activity className="h-5 w-5 text-signal-400" strokeWidth={2.25} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-graphite-900">
            Plateforme SAV-IA
          </h1>
          <p className="mt-1.5 max-w-md text-[14px] text-graphite-500">
            Assistance après-vente pilotée par l'IA — diagnostic, pièces détachées et suivi
            d'intervention.
          </p>
        </div>

        {step === 'role' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <RoleCard
              icon={<UserRound className="h-5 w-5" />}
              title="Client"
              description="Déclarer une panne et suivre mon dossier"
              onClick={() => { setMode('client'); setStep('login') }}
            />
            <RoleCard
              icon={<Wrench className="h-5 w-5" />}
              title="Technicien"
              description="Consulter mes tickets et diagnostics IA"
              onClick={() => { setMode('technician'); setStep('login') }}
            />
            <RoleCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Administration"
              description="Base documentaire et statistiques"
              onClick={() => { setMode('admin'); setStep('login') }}
            />
          </div>
        )}

        {step === 'login' && mode && (
          <LoginForm
            mode={mode}
            onBack={() => { setStep('role'); setMode(null) }}
            onSwitchToRegister={() => setStep('register')}
            onClientLogin={() => setStep('invoices')}
          />
        )}

        {step === 'register' && (mode === 'client' || mode === 'technician') && (
          <RegisterForm
            mode={mode}
            onBack={() => setStep('login')}
            onClientRegister={() => setStep('invoices')}
          />
        )}

        {step === 'invoices' && (
          <InvoiceStep
            onBack={() => setStep('login')}
          />
        )}
      </div>
    </div>
  )
}

function RoleCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-lg border border-graphite-100 bg-white p-5 text-left shadow-panel transition-all hover:-translate-y-0.5 hover:border-graphite-200 hover:shadow-raised"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded bg-graphite-50 text-graphite-700 transition-colors group-hover:bg-signal-50 group-hover:text-signal-600">
        {icon}
      </div>
      <div>
        <p className="font-display text-[15px] font-semibold text-graphite-900">{title}</p>
        <p className="mt-0.5 text-[13px] text-graphite-500">{description}</p>
      </div>
      <span className="mt-1 flex items-center gap-1 text-[12.5px] font-medium text-signal-600">
        Continuer
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

function LoginForm({
  mode,
  onBack,
  onSwitchToRegister,
  onClientLogin,
}: {
  mode: 'client' | 'technician' | 'admin'
  onBack: () => void
  onSwitchToRegister: () => void
  onClientLogin: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useApp()
  const navigate = useNavigate()

  const titles = { client: 'Connexion Client', technician: 'Connexion Technicien', admin: 'Connexion Administration' }

  const submit = async () => {
    setError(null)
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim(),
        password,
        role: mode,
      })
      login(data.access_token, data.refresh_token, {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role as UserRole,
        label: data.user.label,
      })
      if (mode === 'client') {
        onClientLogin()
      } else if (mode === 'technician') {
        navigate('/tech')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      setError((err as Error).message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-graphite-100 bg-white p-5 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <p className="label-caps text-graphite-400">{titles[mode]}</p>
        <button onClick={onBack} className="text-[12.5px] text-graphite-400 hover:text-graphite-700">
          ← Retour
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-[12.5px] font-medium text-graphite-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={mode === 'admin' ? 'admin@sav-ia.local' : 'exemple@email.fr'}
            className="mt-1 w-full rounded border border-graphite-200 bg-porcelain px-3.5 py-2 text-sm text-graphite-900 outline-none focus:border-signal-500"
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-graphite-600">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="••••••••"
            className="mt-1 w-full rounded border border-graphite-200 bg-porcelain px-3.5 py-2 text-sm text-graphite-900 outline-none focus:border-signal-500"
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-alert-600">{error}</p>}
      <button
        onClick={submit}
        disabled={loading}
        className="mt-5 inline-flex w-full items-center justify-center rounded bg-signal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-signal-700 disabled:cursor-not-allowed disabled:bg-graphite-200"
      >
        {loading ? 'Connexion…' : 'Se connecter'}
      </button>
      {mode !== 'admin' && (
        <p className="mt-4 text-center text-[12.5px] text-graphite-400">
          Pas encore de compte ?{' '}
          <button onClick={onSwitchToRegister} className="font-medium text-signal-600 hover:text-signal-700">
            Créer un compte
          </button>
        </p>
      )}
    </div>
  )
}

function RegisterForm({
  mode,
  onBack,
  onClientRegister,
}: {
  mode: 'client' | 'technician'
  onBack: () => void
  onClientRegister: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useApp()
  const navigate = useNavigate()

  const titles = { client: 'Inscription Client', technician: 'Inscription Technicien' }

  const submit = async () => {
    setError(null)
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Veuillez remplir les champs obligatoires.')
      return
    }
    setLoading(true)
    try {
      const payload: Record<string, string> = {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role: mode,
      }
      if (phone.trim()) payload.phone = phone.trim()
      if (mode === 'technician' && speciality.trim()) payload.speciality = speciality.trim()

      const { data } = await api.post('/auth/register', payload)
      login(data.access_token, data.refresh_token, {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role as UserRole,
        label: data.user.label,
      })
      if (mode === 'client') onClientRegister()
      else navigate('/tech')
    } catch (err) {
      setError((err as Error).message || "Erreur d'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-graphite-100 bg-white p-5 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <p className="label-caps text-graphite-400">{titles[mode]}</p>
        <button onClick={onBack} className="text-[12.5px] text-graphite-400 hover:text-graphite-700">
          ← Retour
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-[12.5px] font-medium text-graphite-600">Nom complet *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jean Dupont"
            className="mt-1 w-full rounded border border-graphite-200 bg-porcelain px-3.5 py-2 text-sm text-graphite-900 outline-none focus:border-signal-500"
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-graphite-600">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemple@email.fr"
            className="mt-1 w-full rounded border border-graphite-200 bg-porcelain px-3.5 py-2 text-sm text-graphite-900 outline-none focus:border-signal-500"
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-graphite-600">Mot de passe *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded border border-graphite-200 bg-porcelain px-3.5 py-2 text-sm text-graphite-900 outline-none focus:border-signal-500"
          />
        </div>
        {mode === 'client' && (
          <div>
            <label className="block text-[12.5px] font-medium text-graphite-600">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="mt-1 w-full rounded border border-graphite-200 bg-porcelain px-3.5 py-2 text-sm text-graphite-900 outline-none focus:border-signal-500"
            />
          </div>
        )}
        {mode === 'technician' && (
          <div>
            <label className="block text-[12.5px] font-medium text-graphite-600">Spécialité</label>
            <input
              type="text"
              value={speciality}
              onChange={(e) => setSpeciality(e.target.value)}
              placeholder="Lave-linge, Four, etc."
              className="mt-1 w-full rounded border border-graphite-200 bg-porcelain px-3.5 py-2 text-sm text-graphite-900 outline-none focus:border-signal-500"
            />
          </div>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-alert-600">{error}</p>}
      <button
        onClick={submit}
        disabled={loading}
        className="mt-5 inline-flex w-full items-center justify-center rounded bg-signal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-signal-700 disabled:cursor-not-allowed disabled:bg-graphite-200"
      >
        {loading ? 'Création…' : 'Créer mon compte'}
      </button>
    </div>
  )
}

function InvoiceStep({ onBack }: { onBack: () => void }) {
  const { user, setInvoiceId } = useApp()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: invoices, isLoading } = useClientInvoices(user?.id)

  const confirm = () => {
    if (selectedId) setInvoiceId(selectedId)
    navigate('/client', { replace: true })
  }

  const skip = () => {
    navigate('/client', { replace: true })
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-graphite-100 bg-white p-5 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <p className="label-caps text-graphite-400">Votre facture</p>
        <button onClick={onBack} className="text-[12.5px] text-graphite-400 hover:text-graphite-700">
          ← Retour
        </button>
      </div>

      <p className="mb-4 text-[13.5px] text-graphite-600">
        Sélectionnez la facture correspondant à l'appareil en panne.
      </p>

      {isLoading && (
        <p className="py-8 text-center text-[13px] text-graphite-400">Chargement…</p>
      )}

      {!isLoading && invoices && invoices.length === 0 && (
        <div className="py-6 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-graphite-200" />
          <p className="text-[13.5px] text-graphite-500">Aucune facture trouvée.</p>
          <p className="mt-1 text-[12.5px] text-graphite-400">
            Vous pourrez créer un dossier plus tard depuis votre espace.
          </p>
        </div>
      )}

      {!isLoading && invoices && invoices.length > 0 && (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {invoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => setSelectedId(inv.id)}
              className={`flex w-full items-start gap-3 rounded border px-3.5 py-3 text-left transition-colors ${
                selectedId === inv.id
                  ? 'border-signal-400 bg-signal-50'
                  : 'border-graphite-100 hover:border-graphite-200 hover:bg-graphite-50'
              }`}
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-graphite-200">
                {selectedId === inv.id && <Check className="h-3 w-3 text-signal-600" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-graphite-400" />
                  <span className="text-[13.5px] font-medium text-graphite-800">
                    {inv.invoice_number}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[12px] text-graphite-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {inv.purchase_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {inv.products.length} produit{inv.products.length > 1 ? 's' : ''}
                  </span>
                </div>
                {inv.products.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {inv.products.map((p) => (
                      <span
                        key={p.id}
                        className="rounded bg-graphite-50 px-2 py-0.5 text-[11px] text-graphite-500"
                      >
                        {p.brand} {p.model}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-2">
        <button
          onClick={confirm}
          disabled={!selectedId}
          className="inline-flex w-full items-center justify-center rounded bg-signal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-signal-700 disabled:cursor-not-allowed disabled:bg-graphite-200"
        >
          Continuer
        </button>
        <button
          onClick={skip}
          className="inline-flex w-full items-center justify-center rounded border border-graphite-200 bg-white px-4 py-2 text-sm font-medium text-graphite-600 hover:bg-graphite-50"
        >
          Passer pour l'instant
        </button>
      </div>
    </div>
  )
}

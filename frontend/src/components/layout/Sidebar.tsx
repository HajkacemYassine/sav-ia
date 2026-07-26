import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Ticket,
  FileStack,
  LogOut,
  Users,
  Activity,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { initials } from '@/lib/format'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const TECH_NAV: NavItem[] = [
  { to: '/tech', label: 'Tickets assignés', icon: <Ticket className="h-[18px] w-[18px]" /> },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: "Vue d'ensemble", icon: <LayoutGrid className="h-[18px] w-[18px]" /> },
  { to: '/admin/technicians', label: 'Techniciens', icon: <Users className="h-[18px] w-[18px]" /> },
  { to: '/admin/documents', label: 'Base documentaire', icon: <FileStack className="h-[18px] w-[18px]" /> },
]

export function Sidebar({ role }: { role: 'technician' | 'admin' }) {
  const { user, logout } = useApp()
  const items = role === 'technician' ? TECH_NAV : ADMIN_NAV

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-graphite-100 bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-graphite-900">
          <Activity className="h-4 w-4 text-signal-400" strokeWidth={2.25} />
        </div>
        <div>
          <p className="font-display text-[14px] font-semibold leading-tight text-graphite-900">
            SAV-IA
          </p>
          <p className="text-[11px] leading-tight text-graphite-400">Console {role === 'technician' ? 'technicien' : 'admin'}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded px-3 py-2 text-[13.5px] font-medium transition-colors ${
                isActive
                  ? 'bg-signal-50 text-signal-700'
                  : 'text-graphite-500 hover:bg-graphite-50 hover:text-graphite-800'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-graphite-100 p-3">
        <div className="flex items-center gap-2.5 rounded px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-graphite-800 text-[11px] font-semibold text-white">
            {user ? initials(user.label) : '—'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-graphite-800">
              {user?.label ?? 'Non identifié'}
            </p>
            <p className="truncate text-[11px] text-graphite-400">
              {role === 'technician' ? 'Technicien SAV' : 'Administrateur'}
            </p>
          </div>
          <button
            onClick={logout}
            title="Changer d'identité"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700"
          >
            <LogOut className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>
    </aside>
  )
}

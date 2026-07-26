import { Link } from 'react-router-dom'
import { Activity, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { useApp } from '@/context/AppContext'

export function FocusShell({
  children,
  width = 'max-w-2xl',
}: {
  children: ReactNode
  width?: string
}) {
  const { user, logout } = useApp()

  return (
    <div className="min-h-screen bg-porcelain">
      <header className="border-b border-graphite-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/client" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-graphite-900">
              <Activity className="h-3.5 w-3.5 text-signal-400" strokeWidth={2.25} />
            </div>
            <span className="font-display text-[14px] font-semibold text-graphite-900">SAV-IA</span>
          </Link>
          {user && (
            <div className="flex items-center gap-3 text-[13px] text-graphite-500">
              <span>{user.label}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1 rounded px-2 py-1 text-graphite-400 hover:bg-graphite-50 hover:text-graphite-700"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>
      <main className={`mx-auto ${width} animate-fadeUp px-6 py-10`}>{children}</main>
    </div>
  )
}

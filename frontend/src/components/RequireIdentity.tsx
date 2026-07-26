import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import type { UserRole } from '@/types'

export function RequireIdentity({ role }: { role: UserRole }) {
  const { user, isLoading } = useApp()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-porcelain">
        <p className="text-sm text-graphite-400">Chargement…</p>
      </div>
    )
  }

  if (!user || user.role !== role) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

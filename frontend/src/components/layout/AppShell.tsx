import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

export function AppShell({
  role,
  title,
  subtitle,
  action,
  children,
}: {
  role: 'technician' | 'admin'
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-porcelain">
      <Sidebar role={role} />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-graphite-100 bg-white px-8 py-5">
          <div>
            <h1 className="font-display text-xl font-semibold text-graphite-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-[13px] text-graphite-500">{subtitle}</p>}
          </div>
          {action}
        </header>
        <main className="animate-fadeUp px-8 py-7">{children}</main>
      </div>
    </div>
  )
}

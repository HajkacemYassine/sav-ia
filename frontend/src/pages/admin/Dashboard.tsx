import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Ticket, Clock, ShieldAlert, Wrench } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, Spinner } from '@/components/ui/primitives'
import { useAdminStats } from '@/api/admin'
import { STATUS_META, PRIORITY_META } from '@/lib/status'
import type { CountStat, TicketPriority, TicketStatus } from '@/types'

const STATUS_ORDER: TicketStatus[] = [
  'open',
  'assigned',
  'in_progress',
  'waiting_parts',
  'resolved',
  'closed',
]
const PRIORITY_ORDER: TicketPriority[] = ['low', 'medium', 'high', 'critical']

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: '#A0A6B0',
  medium: '#3358F4',
  high: '#E88C12',
  critical: '#D6432E',
}

export default function AdminDashboard() {
  const {
    data: stats,
    isLoading,
  } = useAdminStats()

  const chartStatus = useMemo(() => {
    if (!stats) return []
    return STATUS_ORDER.map((status) => ({
      status,
      label: STATUS_META[status].label,
      count: stats.status_counts.find((item) => item.key === status)?.count ?? 0,
    }))
  }, [stats])

  const chartPriority = useMemo(() => {
    if (!stats) return []
    return PRIORITY_ORDER.map((priority) => ({
      priority,
      label: PRIORITY_META[priority].label,
      count: stats.priority_counts.find((item) => item.key === priority)?.count ?? 0,
    })).filter((p) => p.count > 0)
  }, [stats])

  return (
    <AppShell
      role="admin"
      title="Vue d'ensemble"
      subtitle="Statistiques calculées sur l'ensemble des tickets SAV"
    >
      {isLoading && <Spinner label="Calcul des statistiques…" />}

      {stats && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Ticket className="h-[18px] w-[18px]" />}
              label="Tickets au total"
              value={stats.total_tickets}
              tone="graphite"
            />
            <StatCard
              icon={<Clock className="h-[18px] w-[18px]" />}
              label="En cours de traitement"
              value={stats.open_tickets}
              tone="signal"
            />
            <StatCard
              icon={<ShieldAlert className="h-[18px] w-[18px]" />}
              label="Priorité critique"
              value={stats.critical_tickets}
              tone="alert"
            />
            <StatCard
              icon={<Wrench className="h-[18px] w-[18px]" />}
              label="Taux de résolution"
              value={`${stats.resolution_rate}%`}
              tone="repair"
            />
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Ticket className="h-[18px] w-[18px]" />}
              label="En attente de pièces"
              value={stats.waiting_parts}
              tone="signal"
            />
            <StatCard
              icon={<ShieldAlert className="h-[18px] w-[18px]" />}
              label="Tickets hors garantie"
              value={stats.out_of_warranty}
              tone="alert"
            />
            <StatCard
              icon={<Wrench className="h-[18px] w-[18px]" />}
              label="Coût moyen réparation"
              value={`${stats.average_repair_cost.toFixed(2)} €`}
              tone="repair"
            />
            <StatCard
              icon={<Ticket className="h-[18px] w-[18px]" />}
              label="Commandes de pièces"
              value={stats.part_orders_count}
              tone="graphite"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Répartition par statut" subtitle="Nombre de tickets par étape" />
              <div className="p-5">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartStatus} margin={{ left: -20 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#727A87' }}
                      axisLine={{ stroke: '#E4E6EA' }}
                      tickLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={55}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#727A87' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{
                        fontSize: 12.5,
                        borderRadius: 8,
                        border: '1px solid #E4E6EA',
                      }}
                    />
                    <Bar dataKey="count" fill="#3358F4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Répartition par priorité" subtitle="Sévérité détectée par l'IA" />
              <div className="flex items-center gap-6 p-5">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={stats.byPriority}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {stats.byPriority?.map((entry) => (
                        <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        fontSize: 12.5,
                        borderRadius: 8,
                        border: '1px solid #E4E6EA',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 border-t border-graphite-50 px-5 py-3">
                {stats.byPriority?.map((entry) => (
                  <div key={entry.priority} className="flex items-center gap-1.5 text-[12px] text-graphite-500">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: PRIORITY_COLORS[entry.priority] }}
                    />
                    {entry.label} ({entry.count})
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  )
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  tone: 'graphite' | 'signal' | 'alert' | 'repair'
}) {
  const tones = {
    graphite: 'bg-graphite-50 text-graphite-700',
    signal: 'bg-signal-50 text-signal-600',
    alert: 'bg-alert-50 text-alert-500',
    repair: 'bg-repair-50 text-repair-600',
  }
  return (
    <Card className="p-5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded ${tones[tone]}`}>
        {icon}
      </div>
      <p className="font-display text-2xl font-semibold text-graphite-900">{value}</p>
      <p className="mt-0.5 text-[12.5px] text-graphite-500">{label}</p>
    </Card>
  )
}

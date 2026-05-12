'use client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { DashboardLayout } from '@/components/layout/sidebar';

function StatCard({ label, value, icon: Icon, color, subtitle }: any) {
  return (
    <div className="rounded-xl p-5 border flex flex-col gap-3"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: any }) {
  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    scheduled: { label: 'Agendado', color: '#3b82f6', icon: Calendar },
    confirmed: { label: 'Confirmado', color: '#10b981', icon: CheckCircle },
    waiting: { label: 'Aguardando', color: '#f59e0b', icon: Clock },
    in_progress: { label: 'Em Atendimento', color: '#8b5cf6', icon: Clock },
    completed: { label: 'Finalizado', color: '#10b981', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: '#ef4444', icon: XCircle },
    no_show: { label: 'Não compareceu', color: '#ef4444', icon: AlertTriangle },
  };
  const s = statusConfig[appointment.status] || statusConfig.scheduled;
  const StatusIcon = s.icon;

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0"
      style={{ borderColor: 'var(--border)' }}>
      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: s.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
          {appointment.patient_name}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {appointment.doctor_name} · {format(new Date(appointment.scheduled_at), 'HH:mm')}
        </p>
      </div>
      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
        style={{ color: s.color, background: `${s.color}18` }}>
        <StatusIcon size={12} />
        {s.label}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard.executive(),
    refetchInterval: 60000,
  });

  const { data: chartData } = useQuery({
    queryKey: ['financial-chart', new Date().getFullYear()],
    queryFn: () => api.financial.monthlyChart(String(new Date().getFullYear())),
  });

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      </DashboardLayout>
    );
  }

  const d = data as any;

  return (
    <DashboardLayout title="Dashboard">
      {/* Data */}
      <p className="text-sm capitalize mb-6" style={{ color: 'var(--text-muted)' }}>{today}</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Consultas Hoje"
          value={d?.today?.total || 0}
          icon={Calendar}
          color="#0ea5e9"
          subtitle={`${d?.today?.completed || 0} finalizadas`}
        />
        <StatCard
          label="Receita do Mês"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
            .format(d?.month?.revenue || 0)}
          icon={TrendingUp}
          color="#10b981"
          subtitle="Recebimentos confirmados"
        />
        <StatCard
          label="Novos Pacientes"
          value={d?.month?.new_patients || 0}
          icon={Users}
          color="#8b5cf6"
          subtitle="Neste mês"
        />
        <StatCard
          label="Taxa de Falta"
          value={`${d?.no_show_rate || 0}%`}
          icon={AlertTriangle}
          color={parseFloat(d?.no_show_rate) > 20 ? '#ef4444' : '#f59e0b'}
          subtitle="Últimos 30 dias"
        />
      </div>

      {/* Status do dia */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Aguardando', value: d?.today?.pending || 0, color: '#3b82f6' },
          { label: 'Finalizados', value: d?.today?.completed || 0, color: '#10b981' },
          { label: 'Cancelados', value: d?.today?.cancelled || 0, color: '#f59e0b' },
          { label: 'Faltas', value: d?.today?.no_show || 0, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border text-center"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Próximas consultas */}
      <div className="grid grid-cols-3 gap-6">
        {/* Gráfico financeiro */}
        <div className="col-span-2 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Receitas vs Despesas (2024)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData as any[] || []}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(v: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)]}
              />
              <Area type="monotone" dataKey="income" name="Receita" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Despesa" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Próximas consultas */}
        <div className="rounded-xl p-5 border flex flex-col"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Próximas Consultas
          </h3>
          <div className="flex-1 overflow-y-auto">
            {(d?.upcoming_appointments || []).length > 0
              ? (d.upcoming_appointments).map((a: any) => (
                  <AppointmentRow key={a.id} appointment={a} />
                ))
              : <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  Sem consultas agendadas
                </p>
            }
          </div>
        </div>
      </div>

      {/* Top médicos */}
      {(d?.top_doctors || []).length > 0 && (
        <div className="mt-6 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Top Médicos do Mês
          </h3>
          <div className="space-y-3">
            {d.top_doctors.map((doc: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#cd7c2f' }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{doc.full_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{doc.specialty}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {doc.total_appointments} consultas
                  </p>
                  <p className="text-xs" style={{ color: '#10b981' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(doc.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

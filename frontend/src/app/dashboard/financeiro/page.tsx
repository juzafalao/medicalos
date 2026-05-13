'use client';
// ============================================================
// FINANCEIRO PAGE
// ============================================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle,
  Plus, Check, ChevronDown, Filter,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import api from '@/lib/api-complete';
import { DashboardLayout } from '@/components/layout/sidebar';

function SummaryCard({ label, value, icon: Icon, color, sub }: any) {
  return (
    <div className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

function FinancialPage() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showNewModal, setShowNewModal] = useState(false);
  const qc = useQueryClient();

  const year = String(new Date().getFullYear());

  const { data: txData } = useQuery({
    queryKey: ['transactions', typeFilter, statusFilter, page],
    queryFn: () => api.financial.transactions({ type: typeFilter || undefined, status: statusFilter || undefined, page }),
  });

  const { data: chartData } = useQuery({
    queryKey: ['financial-chart-full', year],
    queryFn: () => api.financial.monthlyChart(year),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) => api.financial.markPaid(id, method),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); toast.success('Pagamento registrado!'); },
  });

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const summary = (txData as any)?.summary || {};
  const transactions = (txData as any)?.transactions || [];

  const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
    pending:   { label: 'Pendente',   bg: '#fef3c7', color: '#92400e' },
    paid:      { label: 'Pago',       bg: '#d1fae5', color: '#065f46' },
    overdue:   { label: 'Vencido',    bg: '#fee2e2', color: '#991b1b' },
    cancelled: { label: 'Cancelado',  bg: '#f1f5f9', color: '#64748b' },
  };

  return (
    <DashboardLayout title="Financeiro">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Receitas Pagas" value={fmt(parseFloat(summary.total_income || '0'))} icon={TrendingUp} color="#10b981" />
        <SummaryCard label="Despesas Pagas" value={fmt(parseFloat(summary.total_expense || '0'))} icon={TrendingDown} color="#ef4444" />
        <SummaryCard label="Saldo do Mês" value={fmt(summary.balance || 0)}
          icon={DollarSign} color={summary.balance >= 0 ? '#10b981' : '#ef4444'} />
        <SummaryCard label="A Receber" value={fmt(parseFloat(summary.pending_income || '0'))}
          icon={AlertCircle} color="#f59e0b" sub="Pendente este mês" />
      </div>

      {/* Chart */}
      <div className="rounded-xl p-5 border mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Fluxo de Caixa {year}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={(chartData as any[]) || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
              formatter={(v: number) => [fmt(v)]} />
            <Legend />
            <Bar dataKey="income" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Lançamentos</h3>
          <div className="flex items-center gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              <option value="">Todos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              <option value="">Todos status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
            </select>
            <button onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: 'var(--primary)' }}>
              <Plus size={13} /> Lançar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Data', 'Descrição', 'Paciente', 'Categoria', 'Valor', 'Status', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => {
                const s = STATUS_BADGE[t.status] || STATUS_BADGE.pending;
                return (
                  <tr key={t.id} className="border-b hover:bg-slate-50/50"
                    style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.due_date ? format(new Date(t.due_date), 'dd/MM/yy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{t.description}</p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.patient_name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {t.category_name && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${t.category_color}22`, color: t.category_color }}>
                          {t.category_name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold"
                      style={{ color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === 'pending' && (
                        <button onClick={() => payMutation.mutate({ id: t.id, method: 'pix' })}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
                          style={{ background: '#d1fae5', color: '#065f46' }}>
                          <Check size={11} /> Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!transactions.length && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum lançamento encontrado</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default FinancialPage;

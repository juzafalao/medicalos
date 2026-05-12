'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Filter, Clock, User, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api-complete';
import { DashboardLayout } from '@/components/layout/sidebar';
import { clsx } from 'clsx';
import type { Appointment } from '@/lib/store/auth.store';

// ── Status badge
const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  scheduled:   { label: 'Agendado',    bg: '#dbeafe', color: '#1d4ed8' },
  confirmed:   { label: 'Confirmado',  bg: '#d1fae5', color: '#065f46' },
  waiting:     { label: 'Aguardando',  bg: '#fef3c7', color: '#92400e' },
  in_progress: { label: 'Atendendo',   bg: '#ede9fe', color: '#5b21b6' },
  completed:   { label: 'Finalizado',  bg: '#d1fae5', color: '#065f46' },
  cancelled:   { label: 'Cancelado',   bg: '#fee2e2', color: '#991b1b' },
  no_show:     { label: 'Falta',       bg: '#fee2e2', color: '#991b1b' },
};

// ── Appointment Card (coluna da agenda)
function AppointmentCard({
  appointment,
  onStatusChange,
  onReschedule,
}: {
  appointment: Appointment & { patient_name: string; doctor_name: string; room_name?: string };
  onStatusChange: (id: string, status: string) => void;
  onReschedule: (appt: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const st = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.scheduled;
  const time = format(new Date(appointment.scheduled_at), 'HH:mm');
  const endTime = format(
    new Date(new Date(appointment.scheduled_at).getTime() + appointment.duration_minutes * 60000),
    'HH:mm',
  );

  const nextStatuses: Record<string, { label: string; value: string }[]> = {
    scheduled:   [{ label: 'Confirmar',   value: 'confirmed' }, { label: 'Cancelar', value: 'cancelled' }],
    confirmed:   [{ label: 'Aguardando',  value: 'waiting'  }, { label: 'Cancelar', value: 'cancelled' }],
    waiting:     [{ label: 'Atendendo',   value: 'in_progress' }],
    in_progress: [{ label: 'Finalizar',   value: 'completed' }],
    completed:   [],
    cancelled:   [],
    no_show:     [],
  };

  return (
    <div
      className="rounded-lg border-l-4 p-3 mb-2 cursor-pointer hover:shadow-md transition-all select-none"
      style={{ background: 'var(--bg-card)', borderLeftColor: st.color, borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
      onClick={() => setOpen(!open)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
            {appointment.patient_name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {appointment.appointment_type || 'Consulta'} · {time}–{endTime}
          </p>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
          style={{ background: st.bg, color: st.color }}
        >
          {st.label}
        </span>
      </div>

      {/* Expanded */}
      {open && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <User size={12} /> Dr(a). {appointment.doctor_name}
          </div>
          {appointment.room_name && (
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              📍 {appointment.room_name}
            </div>
          )}
          {appointment.price && (
            <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.price)}
              {appointment.insurance_name && ` · ${appointment.insurance_name}`}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {(nextStatuses[appointment.status] || []).map((s) => (
              <button
                key={s.value}
                onClick={(e) => { e.stopPropagation(); onStatusChange(appointment.id, s.value); }}
                className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80"
                style={{ background: STATUS_CONFIG[s.value]?.bg, color: STATUS_CONFIG[s.value]?.color }}
              >
                {s.label}
              </button>
            ))}
            {['scheduled', 'confirmed'].includes(appointment.status) && (
              <button
                onClick={(e) => { e.stopPropagation(); onReschedule(appointment); }}
                className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                style={{ background: '#f1f5f9', color: '#475569' }}
              >
                <RefreshCw size={10} /> Reagendar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal novo agendamento
function NewAppointmentModal({ date, onClose, onSave }: { date: Date; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    patient_id: '', doctor_id: '', scheduled_at: format(date, "yyyy-MM-dd'T'HH:mm"),
    duration_minutes: 30, appointment_type: 'Consulta', reason: '', price: '',
  });

  const { data: patients } = useQuery({ queryKey: ['patients-select'], queryFn: () => api.patients.list({ limit: 100 }) });
  const { data: doctors } = useQuery({ queryKey: ['doctors-select'], queryFn: () => api.users.list() });

  const doctorList = (doctors as any[])?.filter((u: any) => u.role === 'doctor') || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" style={{ background: 'var(--bg-card)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>Novo Agendamento</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Paciente</label>
            <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              <option value="">Selecione o paciente</option>
              {((patients as any)?.data || []).map((p: any) => (
                <option key={p.id} value={p.id}>{p.full_name} · {p.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Profissional</label>
            <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              <option value="">Selecione o profissional</option>
              {doctorList.map((d: any) => (
                <option key={d.id} value={d.id}>Dr(a). {d.full_name} · {d.specialty}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Data e Hora</label>
              <input type="datetime-local" value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Duração (min)</label>
              <select value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                {[15, 20, 30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Tipo</label>
              <select value={form.appointment_type} onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                {['Consulta', 'Retorno', 'Procedimento', 'Avaliação', 'Exame'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Valor (R$)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0,00"
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Motivo da consulta</label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={2} placeholder="Opcional..."
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Cancelar
          </button>
          <button onClick={() => onSave(form)}
            disabled={!form.patient_id || !form.doctor_id}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--primary)' }}>
            Agendar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page
export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [showNewModal, setShowNewModal] = useState(false);
  const qc = useQueryClient();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', dateStr, selectedDoctor, viewMode],
    queryFn: () =>
      viewMode === 'day'
        ? api.appointments.byDate(dateStr, selectedDoctor)
        : api.appointments.byRange(
            format(startOfWeek(selectedDate, { locale: ptBR }), 'yyyy-MM-dd'),
            format(addDays(startOfWeek(selectedDate, { locale: ptBR }), 6), 'yyyy-MM-dd'),
            selectedDoctor,
          ),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.users.list(),
    select: (data: any) => (data || []).filter((u: any) => u.role === 'doctor'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.appointments.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Status atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.appointments.create({
      ...data,
      scheduled_at: new Date(data.scheduled_at).toISOString(),
      price: data.price ? parseFloat(data.price) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      setShowNewModal(false);
      toast.success('Agendamento criado! Confirmação enviada via WhatsApp 📲');
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao agendar'),
  });

  // Slots de hora para visualização dia
  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7h às 19h

  const apptList = (appointments as any[]) || [];

  const getApptsForHour = (hour: number) =>
    apptList.filter((a: any) => new Date(a.scheduled_at).getHours() === hour);

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(selectedDate, { locale: ptBR }), i),
  );

  return (
    <DashboardLayout title="Agenda Médica">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? -1 : -7))}
            className="p-2 rounded-lg border transition-all hover:bg-slate-100"
            style={{ borderColor: 'var(--border)' }}>
            <ChevronLeft size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
          <div className="text-center">
            <p className="font-semibold" style={{ color: 'var(--text)' }}>
              {viewMode === 'day'
                ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })
                : `${format(weekDays[0], 'd MMM', { locale: ptBR })} – ${format(weekDays[6], 'd MMM yyyy', { locale: ptBR })}`}
            </p>
            {viewMode === 'day' && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {apptList.length} consulta{apptList.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? 1 : 7))}
            className="p-2 rounded-lg border transition-all hover:bg-slate-100"
            style={{ borderColor: 'var(--border)' }}>
            <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
          <button onClick={() => setSelectedDate(new Date())}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
            style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {(['day', 'week'] as const).map((v) => (
              <button key={v} onClick={() => setViewMode(v)}
                className="px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: viewMode === v ? 'var(--primary)' : 'var(--bg-card)',
                  color: viewMode === v ? 'white' : 'var(--text-muted)',
                }}>
                {v === 'day' ? 'Dia' : 'Semana'}
              </button>
            ))}
          </div>

          {/* Doctor filter */}
          <select value={selectedDoctor || ''} onChange={(e) => setSelectedDoctor(e.target.value || undefined)}
            className="px-3 py-1.5 rounded-lg text-sm border outline-none"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            <option value="">Todos os profissionais</option>
            {(doctors as any[]).map((d: any) => (
              <option key={d.id} value={d.id}>Dr(a). {d.full_name}</option>
            ))}
          </select>

          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'var(--primary)' }}>
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Day view */}
      {viewMode === 'day' && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[calc(100vh-260px)]">
              {hours.map((hour) => {
                const hourAppts = getApptsForHour(hour);
                return (
                  <div key={hour} className="flex border-b min-h-[80px]"
                    style={{ borderColor: 'var(--border)' }}>
                    {/* Time label */}
                    <div className="w-16 flex-shrink-0 flex items-start justify-center pt-3 border-r"
                      style={{ borderColor: 'var(--border)' }}>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        {String(hour).padStart(2, '0')}:00
                      </span>
                    </div>
                    {/* Appointments */}
                    <div className="flex-1 p-2">
                      {hourAppts.length > 0 ? (
                        <div className={clsx('grid gap-2', hourAppts.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                          {hourAppts.map((appt: any) => (
                            <AppointmentCard
                              key={appt.id}
                              appointment={appt}
                              onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
                              onReschedule={(a) => toast('Função de reagendamento em desenvolvimento')}
                            />
                          ))}
                        </div>
                      ) : (
                        <div
                          className="h-full min-h-[60px] rounded-lg border-dashed border flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                          style={{ borderColor: 'var(--border)' }}
                          onClick={() => {
                            const d = new Date(selectedDate);
                            d.setHours(hour, 0, 0, 0);
                            setSelectedDate(d);
                            setShowNewModal(true);
                          }}
                        >
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+ Agendar</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Week view */}
      {viewMode === 'week' && (
        <div className="rounded-xl border overflow-hidden overflow-x-auto"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {/* Header */}
          <div className="grid grid-cols-8 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="p-3" />
            {weekDays.map((day) => (
              <div key={day.toISOString()}
                className={clsx('p-3 text-center border-l', isSameDay(day, new Date()) && 'bg-blue-50')}
                style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>
                  {format(day, 'EEE', { locale: ptBR })}
                </p>
                <p className={clsx('text-lg font-bold mt-0.5', isSameDay(day, new Date()) ? 'text-blue-600' : '')}
                  style={{ color: isSameDay(day, new Date()) ? '#2563eb' : 'var(--text)' }}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>
          {/* Body */}
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]"
              style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-center pt-2 border-r"
                style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {String(hour).padStart(2, '0')}h
                </span>
              </div>
              {weekDays.map((day) => {
                const dayAppts = apptList.filter((a: any) => {
                  const d = new Date(a.scheduled_at);
                  return isSameDay(d, day) && d.getHours() === hour;
                });
                return (
                  <div key={day.toISOString()}
                    className={clsx('p-1 border-l', isSameDay(day, new Date()) && 'bg-blue-50/30')}
                    style={{ borderColor: 'var(--border)' }}>
                    {dayAppts.map((a: any) => (
                      <div key={a.id}
                        className="rounded text-xs p-1 mb-1 truncate font-medium cursor-pointer"
                        style={{ background: STATUS_CONFIG[a.status]?.bg, color: STATUS_CONFIG[a.status]?.color }}>
                        {format(new Date(a.scheduled_at), 'HH:mm')} {a.patient_name}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Summary bar */}
      <div className="mt-4 flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, val]) => {
          const count = apptList.filter((a: any) => a.status === key).length;
          if (!count) return null;
          return (
            <span key={key} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: val.bg, color: val.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: val.color }} />
              {val.label}: {count}
            </span>
          );
        })}
      </div>

      {/* Modal */}
      {showNewModal && (
        <NewAppointmentModal
          date={selectedDate}
          onClose={() => setShowNewModal(false)}
          onSave={(data) => createMutation.mutate(data)}
        />
      )}
    </DashboardLayout>
  );
}

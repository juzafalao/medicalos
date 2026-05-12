'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, Plus, Phone, Mail, Calendar, ChevronRight,
  User, Heart, FileText, MessageSquare, X, Edit2, Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { DashboardLayout } from '@/components/layout/sidebar';
import type { Patient } from '@/lib/store/auth.store';

// ── Patient form modal
function PatientModal({ patient, onClose, onSave }: { patient?: Patient; onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({
    full_name: patient?.full_name || '',
    phone: patient?.phone || '',
    whatsapp: patient?.whatsapp || '',
    email: patient?.email || '',
    cpf: patient?.cpf || '',
    date_of_birth: patient?.date_of_birth?.split('T')[0] || '',
    gender: patient?.gender || 'not_informed',
    blood_type: patient?.blood_type || '',
    allergies: patient?.allergies || '',
    insurance_name: patient?.insurance_name || '',
    insurance_number: patient?.insurance_number || '',
    notes: patient?.notes || '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)' }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b z-10"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            {patient ? 'Editar Paciente' : 'Novo Paciente'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Dados pessoais */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Nome Completo *</label>
                <input value={form.full_name} onChange={(e) => set('full_name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>CPF</label>
                <input value={form.cpf} onChange={(e) => set('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Data de Nascimento</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Sexo</label>
                <select value={form.gender} onChange={(e) => set('gender', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                  <option value="not_informed">Não informado</option>
                  <option value="female">Feminino</option>
                  <option value="male">Masculino</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Tipo Sanguíneo</label>
                <select value={form.blood_type} onChange={(e) => set('blood_type', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                  <option value="">-</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Contato</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Telefone *</label>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>WhatsApp</label>
                <input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <div className="col-span-2">
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Email</label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
            </div>
          </div>

          {/* Convênio */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Convênio</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Convênio</label>
                <input value={form.insurance_name} onChange={(e) => set('insurance_name', e.target.value)}
                  placeholder="Ex: Unimed, Bradesco..."
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Nº Carteirinha</label>
                <input value={form.insurance_number} onChange={(e) => set('insurance_number', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
            </div>
          </div>

          {/* Clínico */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Informações Clínicas</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Alergias</label>
                <textarea value={form.allergies} onChange={(e) => set('allergies', e.target.value)}
                  rows={2} placeholder="Descreva alergias conhecidas..."
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Observações Internas</label>
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
                  rows={2} placeholder="Notas visíveis apenas para a equipe..."
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 px-6 py-4 border-t"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Cancelar
          </button>
          <button onClick={() => onSave(form)}
            disabled={!form.full_name || !form.phone}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40"
            style={{ background: 'var(--primary)' }}>
            {patient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Patient row
function PatientRow({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b cursor-pointer hover:bg-slate-50 transition-colors"
      style={{ borderColor: 'var(--border)' }} onClick={onClick}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
        style={{ background: 'var(--primary)' }}>
        {patient.full_name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{patient.full_name}</p>
          {patient.insurance_name && (
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: '#dbeafe', color: '#1d4ed8' }}>
              {patient.insurance_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Phone size={11} /> {patient.phone}
          </span>
          {age && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{age} anos</span>}
          {patient.total_appointments && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {patient.total_appointments} consulta{Number(patient.total_appointments) !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {patient.last_appointment_at && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Última: {format(new Date(patient.last_appointment_at), 'dd/MM/yy')}
          </p>
        )}
        <ChevronRight size={16} className="mt-1 ml-auto" style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  );
}

// ── Main
export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | undefined>(undefined);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, search],
    queryFn: () => api.patients.list({ page, limit: 25, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const { data: timeline } = useQuery({
    queryKey: ['patient-timeline', selectedPatient?.id],
    queryFn: () => api.patients.timeline(selectedPatient!.id),
    enabled: !!selectedPatient,
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.patients.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      setShowModal(false);
      toast.success('Paciente cadastrado!');
    },
    onError: () => toast.error('Erro ao cadastrar'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patients.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      setEditPatient(undefined);
      toast.success('Dados atualizados!');
    },
  });

  const patients = (data as any)?.data || [];
  const meta = (data as any)?.meta || {};

  const copyPreRegLink = (patient: Patient) => {
    const link = `${window.location.origin}/pre-cadastro/${patient.pre_registration_token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de pré-cadastro copiado!');
  };

  return (
    <DashboardLayout title="Pacientes">
      <div className="flex gap-6">
        {/* List */}
        <div className={`flex-1 rounded-xl border overflow-hidden ${selectedPatient ? 'hidden lg:block' : ''}`}
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}>
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por nome, CPF ou telefone..."
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {meta.total || 0} pacientes
              </span>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}>
                <Plus size={15} /> Novo
              </button>
            </div>
          </div>

          {/* Rows */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : patients.length > 0 ? (
            <>
              {patients.map((p: Patient) => (
                <PatientRow key={p.id} patient={p} onClick={() => setSelectedPatient(p)} />
              ))}
              {/* Pagination */}
              {meta.total > 25 && (
                <div className="flex items-center justify-between px-5 py-3 border-t"
                  style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                    className="text-sm px-3 py-1.5 rounded-lg border disabled:opacity-40"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                    Anterior
                  </button>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Página {page} de {Math.ceil(meta.total / 25)}
                  </span>
                  <button onClick={() => setPage(page + 1)} disabled={page * 25 >= meta.total}
                    className="text-sm px-3 py-1.5 rounded-lg border disabled:opacity-40"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                    Próxima
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <User size={32} style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {search ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado ainda'}
              </p>
              {!search && (
                <button onClick={() => setShowModal(true)}
                  className="text-sm px-4 py-2 rounded-lg font-medium text-white"
                  style={{ background: 'var(--primary)' }}>
                  Cadastrar primeiro paciente
                </button>
              )}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedPatient && (
          <div className="w-full lg:w-96 rounded-xl border flex flex-col"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b"
              style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: 'var(--primary)' }}>
                  {selectedPatient.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text)' }}>{selectedPatient.full_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {selectedPatient.insurance_name || 'Particular'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditPatient(selectedPatient)}
                  className="p-2 rounded-lg hover:bg-slate-100">
                  <Edit2 size={15} style={{ color: 'var(--text-muted)' }} />
                </button>
                <button onClick={() => copyPreRegLink(selectedPatient)}
                  className="p-2 rounded-lg hover:bg-slate-100">
                  <Share2 size={15} style={{ color: 'var(--text-muted)' }} />
                </button>
                <button onClick={() => setSelectedPatient(null)}
                  className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={15} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-5 space-y-3 border-b" style={{ borderColor: 'var(--border)' }}>
              {[
                { icon: Phone, label: selectedPatient.phone },
                { icon: Mail, label: selectedPatient.email || '—' },
                { icon: Heart, label: selectedPatient.blood_type ? `Tipo ${selectedPatient.blood_type}` : '—' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <Icon size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text)' }}>{label}</span>
                </div>
              ))}
              {selectedPatient.allergies && (
                <div className="text-xs px-3 py-2 rounded-lg"
                  style={{ background: '#fef3c7', color: '#92400e' }}>
                  ⚠️ Alergias: {selectedPatient.allergies}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-muted)' }}>
                Histórico
              </h4>
              {((timeline as any)?.appointments || []).slice(0, 8).map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 py-2.5 border-b last:border-0"
                  style={{ borderColor: 'var(--border)' }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                      {format(new Date(a.scheduled_at), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {a.doctor_name} · {a.appointment_type || 'Consulta'}
                    </p>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ background: '#d1fae5', color: '#065f46' }}>
                    {a.status === 'completed' ? 'Realizada' : a.status}
                  </span>
                </div>
              ))}
              {!(timeline as any)?.appointments?.length && (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma consulta registrada
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <PatientModal
          onClose={() => setShowModal(false)}
          onSave={(d) => createMutation.mutate(d)}
        />
      )}
      {editPatient && (
        <PatientModal
          patient={editPatient}
          onClose={() => setEditPatient(undefined)}
          onSave={(d) => updateMutation.mutate({ id: editPatient.id, data: d })}
        />
      )}
    </DashboardLayout>
  );
}

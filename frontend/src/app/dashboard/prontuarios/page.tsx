'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, FileText, Plus, ChevronRight, Stethoscope,
  Activity, User, Calendar, Lock, Unlock, Filter,
} from 'lucide-react';
import api from '@/lib/api-complete';
import { DashboardLayout } from '@/components/layout/sidebar';
import { useAuthStore } from '@/lib/store/auth.store';
import toast from 'react-hot-toast';

// ── Badge de status do prontuário
function RecordBadge({ record }: { record: any }) {
  if (record.is_signed) {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: '#d1fae5', color: '#065f46' }}>
        <Lock size={10} /> Assinado
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: '#fef3c7', color: '#92400e' }}>
      <Unlock size={10} /> Rascunho
    </span>
  );
}

// ── Card de resumo do prontuário na listagem
function RecordCard({ record, onClick }: { record: any; onClick: () => void }) {
  return (
    <div
      className="flex items-start gap-4 px-5 py-4 border-b cursor-pointer hover:bg-slate-50/50 transition-colors"
      style={{ borderColor: 'var(--border)' }}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: '#dbeafe' }}>
        <Stethoscope size={18} style={{ color: '#1d4ed8' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
            {record.patient_name}
          </p>
          <RecordBadge record={record} />
          {record.total_documents > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: '#ede9fe', color: '#5b21b6' }}>
              {record.total_documents} doc{record.total_documents !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Dr(a). {record.doctor_name} · {record.doctor_specialty}
        </p>
        {record.diagnosis && (
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--text)' }}>
            🩺 {record.diagnosis}
          </p>
        )}
        {record.cid10_codes?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {record.cid10_codes.slice(0, 3).map((c: string) => (
              <span key={c} className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ background: '#f1f5f9', color: '#475569' }}>{c}</span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {format(new Date(record.created_at), "dd/MM/yy 'às' HH:mm")}
        </p>
        <ChevronRight size={15} className="mt-2 ml-auto" style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  );
}

export default function ProntuariosPage() {
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showNewRecord, setShowNewRecord] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: patients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => api.patients.list({ search: patientSearch || undefined, limit: 10 }),
    enabled: patientSearch.length > 1,
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ['medical-records', selectedPatient?.id],
    queryFn: () => api.medicalRecords.list(selectedPatient.id),
    enabled: !!selectedPatient,
  });

  const patientList = (patients as any)?.data || [];
  const recordList = (records as any[]) || [];

  return (
    <DashboardLayout title="Prontuários Eletrônicos">
      <div className="flex gap-6">
        {/* Painel esquerdo - busca + lista */}
        <div className="w-80 flex-shrink-0">
          {/* Busca de paciente */}
          <div className="rounded-xl border overflow-hidden mb-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Buscar Paciente
              </p>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Nome, CPF ou telefone..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>

            {/* Resultados da busca */}
            {patientSearch.length > 1 && (
              <div className="max-h-64 overflow-y-auto">
                {patientList.length > 0 ? patientList.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPatient(p); setPatientSearch(''); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-b hover:bg-slate-50 transition-colors"
                    style={{ borderColor: 'var(--border)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--primary)' }}>
                      {p.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{p.full_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.phone}</p>
                    </div>
                  </button>
                )) : (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    Nenhum paciente encontrado
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Paciente selecionado */}
          {selectedPatient && (
            <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: 'var(--primary)' }}>
                  {selectedPatient.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{selectedPatient.full_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedPatient.phone}</p>
                </div>
              </div>

              {selectedPatient.blood_type && (
                <div className="text-xs mb-2 px-2 py-1 rounded flex items-center gap-1.5"
                  style={{ background: '#fee2e2', color: '#991b1b' }}>
                  🩸 Tipo {selectedPatient.blood_type}
                </div>
              )}

              {selectedPatient.allergies && (
                <div className="text-xs mb-2 px-2 py-1.5 rounded"
                  style={{ background: '#fef3c7', color: '#92400e' }}>
                  ⚠️ <strong>Alergias:</strong> {selectedPatient.allergies}
                </div>
              )}

              {selectedPatient.insurance_name && (
                <div className="text-xs px-2 py-1 rounded"
                  style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                  🏥 {selectedPatient.insurance_name}
                </div>
              )}

              <button
                onClick={() => setShowNewRecord(true)}
                className="w-full mt-3 py-2 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1.5"
                style={{ background: 'var(--primary)' }}>
                <Plus size={13} /> Novo Prontuário
              </button>
            </div>
          )}
        </div>

        {/* Painel principal - lista de prontuários */}
        <div className="flex-1">
          {!selectedPatient ? (
            <div className="rounded-xl border flex flex-col items-center justify-center py-24"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <Stethoscope size={40} style={{ color: 'var(--text-muted)' }} />
              <p className="mt-3 font-medium" style={{ color: 'var(--text)' }}>
                Selecione um paciente
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Busque pelo nome, CPF ou telefone no painel ao lado
              </p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
                    Prontuários de {selectedPatient.full_name}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {recordList.length} registro{recordList.length !== 1 ? 's' : ''} encontrado{recordList.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => setShowNewRecord(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'var(--primary)' }}>
                  <Plus size={15} /> Novo
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-7 h-7 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                </div>
              ) : recordList.length > 0 ? (
                recordList.map((r: any) => (
                  <RecordCard
                    key={r.id}
                    record={r}
                    onClick={() => router.push(`/dashboard/prontuarios/${r.id}`)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <FileText size={32} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Nenhum prontuário registrado para este paciente
                  </p>
                  <button onClick={() => setShowNewRecord(true)}
                    className="text-sm px-4 py-2 rounded-lg font-medium text-white mt-1"
                    style={{ background: 'var(--primary)' }}>
                    Criar primeiro prontuário
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal novo prontuário */}
      {showNewRecord && selectedPatient && (
        <NewRecordModal
          patient={selectedPatient}
          onClose={() => setShowNewRecord(false)}
          onCreated={(id: string) => {
            setShowNewRecord(false);
            router.push(`/dashboard/prontuarios/${id}`);
          }}
        />
      )}
    </DashboardLayout>
  );
}

// ── Modal criação rápida
function NewRecordModal({ patient, onClose, onCreated }: any) {
  const [form, setForm] = useState({
    anamnesis: '', diagnosis: '', evolution: '', treatment_plan: '',
    cid10_search: '', cid10_codes: [] as string[],
    vital_signs: {
      weight: '', height: '', blood_pressure_systolic: '',
      blood_pressure_diastolic: '', heart_rate: '', temperature: '',
      oxygen_saturation: '',
    },
  });

  const { data: cid10Results } = useQuery({
    queryKey: ['cid10', form.cid10_search],
    queryFn: () => api.medicalRecords.searchCid10(form.cid10_search),
    enabled: form.cid10_search.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.medicalRecords.create(data),
    onSuccess: (res: any) => onCreated(res.id),
    onError: () => toast.error('Erro ao criar prontuário'),
  });

  const addCid = (code: string) => {
    if (!form.cid10_codes.includes(code)) {
      setForm(f => ({ ...f, cid10_codes: [...f.cid10_codes, code], cid10_search: '' }));
    }
  };

  const removeCid = (code: string) =>
    setForm(f => ({ ...f, cid10_codes: f.cid10_codes.filter(c => c !== code) }));

  const handleSave = () => {
    const vs = form.vital_signs;
    createMutation.mutate({
      patient_id: patient.id,
      anamnesis: form.anamnesis,
      evolution: form.evolution,
      diagnosis: form.diagnosis,
      treatment_plan: form.treatment_plan,
      cid10_codes: form.cid10_codes,
      vital_signs: Object.keys(vs).some(k => (vs as any)[k])
        ? Object.fromEntries(Object.entries(vs).filter(([, v]) => v).map(([k, v]) => [k, parseFloat(String(v))]))
        : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[92vh] flex flex-col"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Novo Prontuário</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Paciente: {patient.full_name}
            </p>
          </div>
          <button onClick={onClose} className="text-xl font-light" style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Sinais Vitais */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}>
              <Activity size={13} /> Sinais Vitais
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'weight', label: 'Peso (kg)', placeholder: '70' },
                { key: 'height', label: 'Altura (cm)', placeholder: '170' },
                { key: 'blood_pressure_systolic', label: 'PAS (mmHg)', placeholder: '120' },
                { key: 'blood_pressure_diastolic', label: 'PAD (mmHg)', placeholder: '80' },
                { key: 'heart_rate', label: 'FC (bpm)', placeholder: '72' },
                { key: 'temperature', label: 'Temp. (°C)', placeholder: '36.5' },
                { key: 'oxygen_saturation', label: 'SpO₂ (%)', placeholder: '98' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs mb-0.5 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={(form.vital_signs as any)[key]}
                    onChange={e => setForm(f => ({ ...f, vital_signs: { ...f.vital_signs, [key]: e.target.value } }))}
                    className="w-full px-2 py-1.5 rounded-lg text-sm border outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Anamnese */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}>Anamnese / Queixa Principal</h3>
            <textarea
              value={form.anamnesis}
              onChange={e => setForm(f => ({ ...f, anamnesis: e.target.value }))}
              rows={4}
              placeholder="Descreva a queixa principal, história da doença atual, antecedentes..."
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none resize-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </section>

          {/* Diagnóstico + CID-10 */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}>Diagnóstico</h3>
            <textarea
              value={form.diagnosis}
              onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
              rows={2}
              placeholder="Hipótese diagnóstica..."
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none resize-none mb-3"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />

            {/* CID-10 */}
            <div className="relative">
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Buscar CID-10
              </label>
              <input
                value={form.cid10_search}
                onChange={e => setForm(f => ({ ...f, cid10_search: e.target.value }))}
                placeholder="Ex: J45 ou Asma..."
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
              {(cid10Results as any[])?.length > 0 && form.cid10_search.length >= 2 && (
                <div className="absolute z-10 top-full left-0 right-0 rounded-lg border shadow-lg mt-1 max-h-48 overflow-y-auto"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  {(cid10Results as any[]).map((c: any) => (
                    <button
                      key={c.code}
                      onClick={() => addCid(c.code)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 border-b text-sm"
                      style={{ borderColor: 'var(--border)' }}>
                      <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: '#dbeafe', color: '#1d4ed8' }}>{c.code}</span>
                      <span className="truncate" style={{ color: 'var(--text)' }}>{c.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {form.cid10_codes.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {form.cid10_codes.map(code => (
                  <span key={code}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-mono font-medium"
                    style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                    {code}
                    <button onClick={() => removeCid(code)} className="hover:opacity-60 ml-0.5">✕</button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Evolução */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}>Evolução Clínica</h3>
            <textarea
              value={form.evolution}
              onChange={e => setForm(f => ({ ...f, evolution: e.target.value }))}
              rows={4}
              placeholder="Evolução do quadro, exame físico, conduta..."
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none resize-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </section>

          {/* Plano de Tratamento */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}>Plano de Tratamento / Conduta</h3>
            <textarea
              value={form.treatment_plan}
              onChange={e => setForm(f => ({ ...f, treatment_plan: e.target.value }))}
              rows={3}
              placeholder="Medicamentos prescritos, orientações, retorno..."
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none resize-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={createMutation.isPending || !form.anamnesis}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'var(--primary)' }}>
            {createMutation.isPending
              ? <span className="w-4 h-4 border-2 rounded-full animate-spin border-white border-t-transparent" />
              : <FileText size={15} />}
            Salvar Prontuário
          </button>
        </div>
      </div>
    </div>
  );
}

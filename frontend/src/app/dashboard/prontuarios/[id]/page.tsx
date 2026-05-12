'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, Edit2, Lock, FileText, Plus, Download,
  Activity, Stethoscope, ClipboardList, Pill, Save,
  AlertTriangle, User, Heart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api-complete';
import { DashboardLayout } from '@/components/layout/sidebar';
import { useAuthStore } from '@/lib/store/auth.store';

// ── Seção de sinais vitais
function VitalSigns({ vitals }: { vitals: any }) {
  if (!vitals || !Object.keys(vitals).length) return null;

  const items = [
    { key: 'weight', label: 'Peso', unit: 'kg', icon: '⚖️' },
    { key: 'height', label: 'Altura', unit: 'cm', icon: '📏' },
    { key: 'blood_pressure_systolic', label: 'PAS', unit: 'mmHg', icon: '❤️' },
    { key: 'blood_pressure_diastolic', label: 'PAD', unit: 'mmHg', icon: '❤️' },
    { key: 'heart_rate', label: 'FC', unit: 'bpm', icon: '💓' },
    { key: 'temperature', label: 'Temp.', unit: '°C', icon: '🌡️' },
    { key: 'oxygen_saturation', label: 'SpO₂', unit: '%', icon: '🫁' },
    { key: 'blood_glucose', label: 'Glicemia', unit: 'mg/dL', icon: '🩸' },
  ].filter(i => vitals[i.key] !== undefined && vitals[i.key] !== null);

  if (!items.length) return null;

  // Alertas de sinais vitais fora do range
  const getVitalStatus = (key: string, value: number) => {
    const ranges: Record<string, { min: number; max: number }> = {
      blood_pressure_systolic: { min: 90, max: 140 },
      blood_pressure_diastolic: { min: 60, max: 90 },
      heart_rate: { min: 60, max: 100 },
      temperature: { min: 36.0, max: 37.5 },
      oxygen_saturation: { min: 95, max: 100 },
    };
    const range = ranges[key];
    if (!range) return 'normal';
    if (value < range.min || value > range.max) return 'alert';
    return 'normal';
  };

  return (
    <div className="rounded-xl border p-5"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-1.5"
        style={{ color: 'var(--text-muted)' }}>
        <Activity size={13} /> Sinais Vitais
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {items.map(({ key, label, unit, icon }) => {
          const value = vitals[key];
          const status = getVitalStatus(key, value);
          return (
            <div key={key} className="rounded-lg p-3 text-center"
              style={{ background: status === 'alert' ? '#fef3c720' : 'var(--bg)' }}>
              <p className="text-lg mb-0.5">{icon}</p>
              <p className="text-lg font-bold" style={{
                color: status === 'alert' ? '#f59e0b' : 'var(--text)',
              }}>
                {value}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{unit}</p>
              {status === 'alert' && (
                <AlertTriangle size={10} className="mx-auto mt-1" style={{ color: '#f59e0b' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Bloco de texto clínico (anamnese, evolução, etc)
function ClinicalSection({
  title, icon: Icon, content, placeholder, editing, fieldKey,
  editValue, onEdit,
}: {
  title: string; icon: any; content?: string; placeholder: string;
  editing: boolean; fieldKey: string; editValue: string;
  onEdit: (key: string, value: string) => void;
}) {
  if (!editing && !content) return null;

  return (
    <div className="rounded-xl border p-5"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
        style={{ color: 'var(--text-muted)' }}>
        <Icon size={13} /> {title}
      </h3>
      {editing ? (
        <textarea
          value={editValue}
          onChange={e => onEdit(fieldKey, e.target.value)}
          rows={5}
          className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none resize-none"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
          placeholder={placeholder}
        />
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
          {content}
        </p>
      )}
    </div>
  );
}

// ── Modal de documento clínico
function DocumentModal({ recordId, patientId, onClose, onCreated }: any) {
  const [form, setForm] = useState({ type: 'prescription', title: 'Receita Médica', content: '' });
  const { data: templates } = useQuery({
    queryKey: ['doc-templates', form.type],
    queryFn: () => api.medicalRecords.getDocumentTemplates(form.type),
  });

  const createMutation = useMutation({
    mutationFn: () => api.medicalRecords.createDocument(recordId, {
      patient_id: patientId, type: form.type, title: form.title, content: form.content,
    }),
    onSuccess: () => { onCreated(); toast.success('Documento criado!'); },
    onError: () => toast.error('Erro ao criar documento'),
  });

  const DOC_TYPES = [
    { value: 'prescription', label: '💊 Receita' },
    { value: 'certificate', label: '📋 Atestado' },
    { value: 'referral', label: '🔁 Encaminhamento' },
    { value: 'exam_request', label: '🔬 Solicitação de Exame' },
    { value: 'other', label: '📄 Outro' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="rounded-2xl w-full max-w-xl mx-4 shadow-2xl"
        style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text)' }}>Novo Documento</h2>
          <button onClick={onClose} className="text-lg" style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Tipo</label>
              <select value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value, title: DOC_TYPES.find(t => t.value === e.target.value)?.label.replace(/^\S+ /, '') || '' }))}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Título</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
          </div>

          {/* Templates disponíveis */}
          {(templates as any[])?.length > 0 && (
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Usar template (opcional)
              </label>
              <div className="flex gap-2 flex-wrap">
                {(templates as any[]).map((t: any) => (
                  <button key={t.id}
                    onClick={() => setForm(f => ({ ...f, content: t.content, title: t.name }))}
                    className="text-xs px-2.5 py-1 rounded-lg border hover:opacity-80"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Conteúdo</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={10} placeholder="Conteúdo do documento..."
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none resize-none font-mono"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Cancelar
          </button>
          <button onClick={() => createMutation.mutate()}
            disabled={!form.title || !form.content || createMutation.isPending}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40"
            style={{ background: 'var(--primary)' }}>
            Criar Documento
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal
export default function ProntuarioDetailPage({ params }: { params: { id: string } }) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showDocModal, setShowDocModal] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: record, isLoading } = useQuery({
    queryKey: ['medical-record', params.id],
    queryFn: () => api.medicalRecords.get(params.id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.medicalRecords.update(params.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-record', params.id] });
      setEditing(false);
      toast.success('Prontuário salvo!');
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const signMutation = useMutation({
    mutationFn: () => api.medicalRecords.sign(params.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-record', params.id] });
      toast.success('Prontuário assinado digitalmente!');
    },
  });

  const r = record as any;

  const startEditing = () => {
    setEditForm({
      anamnesis: r?.anamnesis || '',
      physical_exam: r?.physical_exam || '',
      evolution: r?.evolution || '',
      diagnosis: r?.diagnosis || '',
      treatment_plan: r?.treatment_plan || '',
      observations: r?.observations || '',
    });
    setEditing(true);
  };

  const saveEditing = () => updateMutation.mutate(editForm);
  const editField = (key: string, value: string) => setEditForm(f => ({ ...f, [key]: value }));

  const canEdit = !r?.is_signed && (user?.role === 'admin' || user?.role === 'doctor');

  if (isLoading) {
    return (
      <DashboardLayout title="Prontuário">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!r) return <DashboardLayout title="Prontuário"><p>Não encontrado</p></DashboardLayout>;

  return (
    <DashboardLayout title="Prontuário">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="p-2 rounded-lg border hover:bg-slate-100 transition-colors"
              style={{ borderColor: 'var(--border)' }}>
              <ArrowLeft size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                {r.patient_name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Dr(a). {r.doctor_name} · {r.doctor_specialty}
                </span>
                {r.doctor_crm && (
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    CRM {r.doctor_crm}
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  · {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {r.is_signed ? (
              <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#d1fae5', color: '#065f46' }}>
                <Lock size={14} /> Assinado Digitalmente
              </span>
            ) : (
              <>
                {canEdit && !editing && (
                  <button onClick={startEditing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                    <Edit2 size={14} /> Editar
                  </button>
                )}
                {editing && (
                  <>
                    <button onClick={() => setEditing(false)}
                      className="px-3 py-2 rounded-lg text-sm border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      Cancelar
                    </button>
                    <button onClick={saveEditing}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                      style={{ background: 'var(--accent)' }}>
                      <Save size={14} /> Salvar
                    </button>
                  </>
                )}
                {!editing && canEdit && (
                  <button onClick={() => signMutation.mutate()}
                    disabled={signMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ background: '#7c3aed' }}>
                    <Lock size={14} /> Assinar
                  </button>
                )}
              </>
            )}
            <button onClick={() => setShowDocModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'var(--primary)' }}>
              <Plus size={14} /> Documento
            </button>
          </div>
        </div>

        {/* Info do paciente */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Convênio', value: r.insurance_name || 'Particular', icon: '🏥' },
            { label: 'Tipo sanguíneo', value: r.blood_type || '—', icon: '🩸' },
            { label: 'Consulta', value: r.appointment_date ? format(new Date(r.appointment_date), 'dd/MM/yyyy') : 'Avulso', icon: '📅' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-lg p-3 border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{icon} {label}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{value}</p>
            </div>
          ))}
        </div>

        {r.allergies && (
          <div className="rounded-xl border p-4 mb-6 flex items-start gap-2"
            style={{ background: '#fef3c720', borderColor: '#fef3c7' }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#92400e' }}>Alergias Conhecidas</p>
              <p className="text-sm mt-0.5" style={{ color: '#92400e' }}>{r.allergies}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Sinais vitais */}
          <VitalSigns vitals={r.vital_signs} />

          {/* CID-10 */}
          {r.cid10_codes?.length > 0 && (
            <div className="rounded-xl border p-5"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-muted)' }}>
                CID-10
              </h3>
              <div className="flex gap-2 flex-wrap">
                {r.cid10_codes.map((code: string) => (
                  <span key={code} className="text-sm px-3 py-1.5 rounded-lg font-mono font-bold"
                    style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Seções clínicas */}
          {[
            { title: 'Anamnese / Queixa Principal', icon: User, key: 'anamnesis', placeholder: 'Queixa principal...' },
            { title: 'Exame Físico', icon: Stethoscope, key: 'physical_exam', placeholder: 'Exame físico...' },
            { title: 'Diagnóstico', icon: ClipboardList, key: 'diagnosis', placeholder: 'Hipótese diagnóstica...' },
            { title: 'Evolução Clínica', icon: Activity, key: 'evolution', placeholder: 'Evolução...' },
            { title: 'Plano de Tratamento', icon: Pill, key: 'treatment_plan', placeholder: 'Conduta e tratamento...' },
          ].map(({ title, icon, key, placeholder }) => (
            <ClinicalSection
              key={key}
              title={title}
              icon={icon}
              content={r[key]}
              placeholder={placeholder}
              editing={editing}
              fieldKey={key}
              editValue={editForm[key] || ''}
              onEdit={editField}
            />
          ))}

          {/* Documentos gerados */}
          {(r.documents || []).length > 0 && (
            <div className="rounded-xl border p-5"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                style={{ color: 'var(--text-muted)' }}>
                <FileText size={13} /> Documentos Gerados
              </h3>
              <div className="space-y-2">
                {r.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                    <div className="flex items-center gap-2">
                      <FileText size={15} style={{ color: 'var(--primary)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{doc.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {format(new Date(doc.created_at), 'dd/MM/yyyy')}
                          {doc.is_signed && ' · ✅ Assinado'}
                        </p>
                      </div>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-slate-100">
                        <Download size={14} style={{ color: 'var(--text-muted)' }} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assinatura */}
          {r.is_signed && (
            <div className="rounded-xl border p-4 text-center"
              style={{ background: '#d1fae520', borderColor: '#d1fae5' }}>
              <Lock size={20} className="mx-auto mb-2" style={{ color: '#065f46' }} />
              <p className="text-sm font-semibold" style={{ color: '#065f46' }}>
                Prontuário assinado digitalmente por Dr(a). {r.doctor_name}
              </p>
              <p className="text-xs mt-1" style={{ color: '#065f46' }}>
                {format(new Date(r.signed_at), "dd/MM/yyyy 'às' HH:mm")} · CRM {r.doctor_crm}
              </p>
            </div>
          )}
        </div>
      </div>

      {showDocModal && (
        <DocumentModal
          recordId={params.id}
          patientId={r.patient_id}
          onClose={() => setShowDocModal(false)}
          onCreated={() => {
            setShowDocModal(false);
            qc.invalidateQueries({ queryKey: ['medical-record', params.id] });
          }}
        />
      )}
    </DashboardLayout>
  );
}

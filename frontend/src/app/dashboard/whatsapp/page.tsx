'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Edit2, Check, X, Zap, Users, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { DashboardLayout } from '@/components/layout/sidebar';

const TEMPLATE_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  confirmation: { label: 'Confirmação',        icon: '✅', desc: 'Enviada 24h antes da consulta' },
  reminder:     { label: 'Lembrete',           icon: '⏰', desc: 'Enviada 2h antes da consulta' },
  followup:     { label: 'Follow-up / NPS',    icon: '⭐', desc: 'Enviada após atendimento' },
  recovery:     { label: 'Recuperação',        icon: '💙', desc: 'Para pacientes inativos (+6 meses)' },
  delay:        { label: 'Aviso de Atraso',    icon: '🕐', desc: 'Notifica pacientes sobre atrasos' },
  nps:          { label: 'NPS Seguimento',     icon: '📊', desc: 'Acompanhamento de satisfação' },
};

function TemplateCard({ template, onEdit }: { template: any; onEdit: (t: any) => void }) {
  const meta = TEMPLATE_LABELS[template.type] || { label: template.type, icon: '💬', desc: '' };
  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{meta.label}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{meta.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: template.is_active ? '#10b981' : '#94a3b8' }} />
          <button onClick={() => onEdit(template)}
            className="p-1.5 rounded-lg hover:bg-slate-100">
            <Edit2 size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>
      <div className="rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap"
        style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'monospace' }}>
        {template.message.length > 200 ? template.message.slice(0, 200) + '...' : template.message}
      </div>
      <div className="mt-2 flex gap-1 flex-wrap">
        {['{{patient_name}}', '{{doctor_name}}', '{{appointment_date}}', '{{appointment_time}}'].map((v) => (
          template.message.includes(v) && (
            <span key={v} className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ background: '#dbeafe', color: '#1d4ed8' }}>{v}</span>
          )
        ))}
      </div>
    </div>
  );
}

function EditTemplateModal({ template, onClose, onSave }: { template: any; onClose: () => void; onSave: (msg: string) => void }) {
  const [message, setMessage] = useState(template.message);
  const vars = ['{{patient_name}}', '{{doctor_name}}', '{{appointment_date}}', '{{appointment_time}}', '{{clinic_name}}'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="rounded-2xl w-full max-w-lg mx-4 shadow-2xl"
        style={{ background: 'var(--bg-card)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text)' }}>Editar Template</h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <div className="p-6">
          <div className="flex gap-1 flex-wrap mb-3">
            {vars.map((v) => (
              <button key={v} onClick={() => setMessage((m: string) => m + v)}
                className="text-xs px-2 py-0.5 rounded font-mono hover:opacity-80"
                style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                + {v}
              </button>
            ))}
          </div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={10}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none font-mono"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Use as variáveis acima para personalizar automaticamente a mensagem.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Cancelar
          </button>
          <button onClick={() => onSave(message)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}>
            Salvar Template
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  const [tab, setTab] = useState<'templates' | 'conversations' | 'send'>('templates');
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [sendForm, setSendForm] = useState({ phone: '', message: '' });
  const qc = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => api.whatsapp.templates(),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: () => api.whatsapp.conversations(),
    enabled: tab === 'conversations',
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      api.whatsapp.updateTemplate(id, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      setEditTemplate(null);
      toast.success('Template atualizado!');
    },
  });

  const recoverMutation = useMutation({
    mutationFn: () => api.whatsapp.triggerRecovery(),
    onSuccess: (data: any) => toast.success(`${data?.sent || 0} mensagens de recuperação agendadas!`),
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => api.whatsapp.sendManual(data),
    onSuccess: () => {
      setSendForm({ phone: '', message: '' });
      toast.success('Mensagem enviada!');
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  });

  const TABS = [
    { id: 'templates', label: 'Templates', icon: Edit2 },
    { id: 'conversations', label: 'Histórico', icon: MessageSquare },
    { id: 'send', label: 'Envio Manual', icon: Send },
  ];

  const STATUS_ICON: Record<string, string> = {
    sent: '✓', delivered: '✓✓', read: '✓✓', failed: '✗', pending: '⏳',
  };

  return (
    <DashboardLayout title="WhatsApp">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Automação Ativa', value: 'API Oficial', icon: Zap, color: '#10b981' },
          { label: 'Templates', value: `${(templates as any[]).length} configurados`, icon: Edit2, color: '#0ea5e9' },
          { label: 'Disparo Inativos', value: 'Toda segunda-feira', icon: Bell, color: '#8b5cf6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border p-4 flex items-center gap-3"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as any)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all"
            style={{
              borderBottomColor: tab === id ? 'var(--primary)' : 'transparent',
              color: tab === id ? 'var(--primary)' : 'var(--text-muted)',
            }}>
            <Icon size={15} /> {label}
          </button>
        ))}

        <div className="ml-auto">
          <button onClick={() => recoverMutation.mutate()}
            disabled={recoverMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#8b5cf6' }}>
            <Users size={13} />
            {recoverMutation.isPending ? 'Enviando...' : 'Recuperar Inativos'}
          </button>
        </div>
      </div>

      {/* Templates */}
      {tab === 'templates' && (
        <div className="grid grid-cols-2 gap-4">
          {(templates as any[]).map((t: any) => (
            <TemplateCard key={t.id} template={t} onEdit={setEditTemplate} />
          ))}
        </div>
      )}

      {/* Conversations */}
      {tab === 'conversations' && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['Paciente', 'Tipo', 'Mensagem', 'Status', 'Data'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(conversations as any[]).map((msg: any) => (
                  <tr key={msg.id} className="border-b hover:bg-slate-50/50"
                    style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--text)' }}>{msg.patient_name || 'Desconhecido'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{msg.phone_to}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                        {TEMPLATE_LABELS[msg.type]?.label || msg.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{msg.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono" style={{
                        color: msg.status === 'read' ? '#10b981' : msg.status === 'failed' ? '#ef4444' : '#94a3b8',
                      }}>
                        {STATUS_ICON[msg.status]} {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {msg.created_at ? new Date(msg.created_at).toLocaleString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(conversations as any[]).length && (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma mensagem registrada</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send manual */}
      {tab === 'send' && (
        <div className="max-w-lg">
          <div className="rounded-xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Envio Manual de WhatsApp</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  Número (com DDD)
                </label>
                <input value={sendForm.phone} onChange={(e) => setSendForm({ ...sendForm, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Mensagem</label>
                <textarea value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                  rows={5} placeholder="Digite a mensagem..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none resize-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {sendForm.message.length}/1000 caracteres
                </p>
              </div>
              <button onClick={() => sendMutation.mutate(sendForm)}
                disabled={!sendForm.phone || !sendForm.message || sendMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40"
                style={{ background: '#25d366' }}>
                <Send size={15} />
                {sendMutation.isPending ? 'Enviando...' : 'Enviar via WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTemplate && (
        <EditTemplateModal
          template={editTemplate}
          onClose={() => setEditTemplate(null)}
          onSave={(message) => updateTemplateMutation.mutate({ id: editTemplate.id, message })}
        />
      )}
    </DashboardLayout>
  );
}

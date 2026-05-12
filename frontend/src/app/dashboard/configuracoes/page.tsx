'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, MessageSquare, Users, Shield, CreditCard,
  Save, Plus, Edit2, ToggleLeft, ToggleRight, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api-complete';
import { DashboardLayout } from '@/components/layout/sidebar';
import { useAuthStore } from '@/lib/store/auth.store';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TABS = [
  { id: 'clinic', label: 'Clínica', icon: Building2 },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'users', label: 'Equipe', icon: Users },
  { id: 'lgpd', label: 'LGPD & Segurança', icon: Shield },
  { id: 'subscription', label: 'Assinatura', icon: CreditCard },
];

// ── Aba: Dados da clínica
function ClinicTab({ tenant }: { tenant: any }) {
  const [form, setForm] = useState({
    name: tenant?.name || '', phone: tenant?.phone || '', cnpj: tenant?.cnpj || '',
    address_street: tenant?.address_street || '', address_number: tenant?.address_number || '',
    address_city: tenant?.address_city || '', address_state: tenant?.address_state || '',
    address_zip: tenant?.address_zip || '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => api.tenants?.update(form),
    onSuccess: () => toast.success('Dados da clínica atualizados!'),
    onError: () => toast.error('Erro ao salvar'),
  });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Informações da Clínica</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Nome da Clínica</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Telefone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>CNPJ</label>
            <input value={form.cnpj} onChange={e => set('cnpj', e.target.value)}
              placeholder="00.000.000/0001-00"
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Rua / Av.</label>
              <input value={form.address_street} onChange={e => set('address_street', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Número</label>
              <input value={form.address_number} onChange={e => set('address_number', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Cidade</label>
            <input value={form.address_city} onChange={e => set('address_city', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>UF</label>
            <input value={form.address_state} onChange={e => set('address_state', e.target.value)}
              maxLength={2} placeholder="SP"
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
        </div>
        <button onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--primary)' }}>
          <Save size={14} /> Salvar Alterações
        </button>
      </div>
    </div>
  );
}

// ── Aba: WhatsApp
function WhatsAppTab({ tenant }: { tenant: any }) {
  const [form, setForm] = useState({
    provider: tenant?.whatsapp_provider || 'twilio',
    api_key: '', phone_number: tenant?.whatsapp_phone_number || '',
  });

  const mutation = useMutation({
    mutationFn: () => api.tenants?.configureWhatsapp(form),
    onSuccess: () => toast.success('WhatsApp configurado com sucesso!'),
    onError: () => toast.error('Erro ao configurar'),
  });

  const PROVIDERS = [
    { value: 'twilio', label: 'Twilio', recommended: true },
    { value: 'blip', label: 'Blip (Take)', recommended: false },
    { value: 'messagebird', label: 'MessageBird', recommended: false },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Configuração da API Oficial</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Use apenas provedores oficiais do WhatsApp Business API para garantir escalabilidade e evitar bloqueios.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {PROVIDERS.map(p => (
            <button key={p.value} onClick={() => setForm(f => ({ ...f, provider: p.value }))}
              className="p-3 rounded-lg border-2 text-sm font-medium transition-all text-left"
              style={{
                borderColor: form.provider === p.value ? 'var(--primary)' : 'var(--border)',
                background: form.provider === p.value ? '#dbeafe' : 'var(--bg)',
                color: form.provider === p.value ? '#1d4ed8' : 'var(--text)',
              }}>
              <p>{p.label}</p>
              {p.recommended && <p className="text-xs mt-0.5 text-green-600 font-normal">Recomendado</p>}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
              API Key / Auth Token
            </label>
            <input type="password" value={form.api_key}
              onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
              placeholder="Deixe em branco para manter o atual"
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none font-mono"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
              Número WhatsApp Business (com DDI)
            </label>
            <input value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
              placeholder="5511999990000"
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none font-mono"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
        </div>

        <button onClick={() => mutation.mutate()}
          className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ background: '#25d366' }}>
          <MessageSquare size={14} /> Salvar Configuração
        </button>
      </div>

      {/* Status atual */}
      <div className="rounded-xl border p-4"
        style={{ background: tenant?.whatsapp_provider ? '#d1fae520' : '#fef3c720', borderColor: tenant?.whatsapp_provider ? '#d1fae5' : '#fef3c7' }}>
        <p className="text-sm font-semibold" style={{ color: tenant?.whatsapp_provider ? '#065f46' : '#92400e' }}>
          {tenant?.whatsapp_provider
            ? `✅ WhatsApp configurado via ${tenant.whatsapp_provider.toUpperCase()}`
            : '⚠️ WhatsApp ainda não configurado'}
        </p>
        {tenant?.whatsapp_phone_number && (
          <p className="text-xs mt-1" style={{ color: '#065f46' }}>
            Número: +{tenant.whatsapp_phone_number}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Aba: Equipe
function UsersTab() {
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '', email: '', password: '', role: 'receptionist',
    specialty: '', crm: '', commission_percentage: '0',
  });
  const qc = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'], queryFn: () => api.users.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.users.create({ ...newUser, commission_percentage: parseFloat(newUser.commission_percentage) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users-list'] }); setShowNewUser(false); toast.success('Usuário criado!'); },
    onError: () => toast.error('Erro ao criar usuário'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.users.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-list'] }),
  });

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador', doctor: 'Médico', receptionist: 'Recepção', financial: 'Financeiro',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowNewUser(!showNewUser)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--primary)' }}>
          <Plus size={14} /> Novo Usuário
        </button>
      </div>

      {showNewUser && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Novo Usuário</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'full_name', label: 'Nome Completo', col: 2 },
              { key: 'email', label: 'Email', type: 'email', col: 1 },
              { key: 'password', label: 'Senha', type: 'password', col: 1 },
            ].map(({ key, label, type, col }) => (
              <div key={key} className={col === 2 ? 'col-span-2' : ''}>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
                <input type={type || 'text'} value={(newUser as any)[key]}
                  onChange={e => setNewUser(u => ({ ...u, [key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
            ))}
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Perfil</label>
              <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {newUser.role === 'doctor' && (
              <>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Especialidade</label>
                  <input value={newUser.specialty} onChange={e => setNewUser(u => ({ ...u, specialty: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>CRM</label>
                  <input value={newUser.crm} onChange={e => setNewUser(u => ({ ...u, crm: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Comissão (%)</label>
                  <input type="number" value={newUser.commission_percentage}
                    onChange={e => setNewUser(u => ({ ...u, commission_percentage: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                </div>
              </>
            )}
          </div>
          <button onClick={() => createMutation.mutate()}
            disabled={!newUser.full_name || !newUser.email || !newUser.password || createMutation.isPending}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
            style={{ background: 'var(--primary)' }}>
            Criar Usuário
          </button>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {(users as any[]).map((u: any, i: number) => (
          <div key={u.id} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t' : ''}`}
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: u.is_active ? 'var(--primary)' : '#94a3b8' }}>
              {u.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{u.full_name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#f1f5f9', color: '#475569' }}>
                  {ROLE_LABELS[u.role]}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {u.email}
                {u.specialty && ` · ${u.specialty}`}
                {u.crm && ` · CRM ${u.crm}`}
                {u.commission_percentage > 0 && ` · ${u.commission_percentage}% comissão`}
              </p>
            </div>
            <button onClick={() => toggleMutation.mutate(u.id)}
              className="flex-shrink-0"
              title={u.is_active ? 'Desativar' : 'Ativar'}>
              {u.is_active
                ? <ToggleRight size={22} style={{ color: '#10b981' }} />
                : <ToggleLeft size={22} style={{ color: '#94a3b8' }} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Aba: LGPD
function LgpdTab() {
  const [patientId, setPatientId] = useState('');
  const [action, setAction] = useState<'export' | 'anonymize' | null>(null);

  const exportMutation = useMutation({
    mutationFn: () => api.tenants?.exportPatientData(patientId),
    onSuccess: (data: any) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `lgpd-export-${patientId}.json`; a.click();
      toast.success('Dados exportados!');
    },
  });

  const anonymizeMutation = useMutation({
    mutationFn: () => api.tenants?.anonymizePatient(patientId),
    onSuccess: () => { setPatientId(''); toast.success('Dados anonimizados conforme LGPD'); },
  });

  const LGPD_FEATURES = [
    { icon: '🔐', title: 'Criptografia de Ponta', desc: 'Dados sensíveis criptografados em repouso e trânsito (AES-256)' },
    { icon: '📋', title: 'Logs de Auditoria', desc: 'Registro completo de quem acessou cada prontuário (quem, quando, onde)' },
    { icon: '🔒', title: 'Row-Level Security', desc: 'Isolamento total de dados entre clínicas no nível do banco de dados' },
    { icon: '💾', title: 'Backup Automático', desc: 'Snapshots diários com redundância geográfica em múltiplas regiões' },
    { icon: '👤', title: 'Controle de Acesso RBAC', desc: 'Permissões granulares por perfil: Admin, Médico, Recepção, Financeiro' },
    { icon: '📤', title: 'Portabilidade de Dados', desc: 'Exportação completa dos dados do paciente em formato JSON (Art. 18 LGPD)' },
    { icon: '🗑️', title: 'Direito ao Esquecimento', desc: 'Anonimização de dados pessoais respeitando prazos de guarda legal' },
    { icon: '✅', title: '100% Compliance LGPD', desc: 'Sistema desenvolvido com Privacy by Design desde a concepção' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {LGPD_FEATURES.map(({ icon, title, desc }) => (
          <div key={title} className="rounded-xl border p-4 flex items-start gap-3"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ações LGPD */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Ações LGPD por Paciente</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Informe o ID do paciente para exercer seus direitos conforme a LGPD (Art. 18)
        </p>
        <div className="flex gap-2 mb-3">
          <input value={patientId} onChange={e => setPatientId(e.target.value)}
            placeholder="ID do paciente (UUID)"
            className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none font-mono"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportMutation.mutate()}
            disabled={!patientId || exportMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
            style={{ background: '#0ea5e9' }}>
            📤 Exportar Dados
          </button>
          <button onClick={() => {
            if (confirm('⚠️ Esta ação anonimizará permanentemente os dados pessoais. Continuar?'))
              anonymizeMutation.mutate();
          }}
            disabled={!patientId || anonymizeMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
            style={{ background: '#ef4444' }}>
            🗑️ Anonimizar Dados
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('clinic');
  const { user } = useAuthStore();

  const { data: tenant } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: () => api.tenants?.getMe(),
  });

  const { data: stats } = useQuery({
    queryKey: ['tenant-stats'],
    queryFn: () => api.tenants?.getStats(),
  });

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout title="Configurações">
        <div className="flex items-center justify-center h-64">
          <p style={{ color: 'var(--text-muted)' }}>Acesso restrito a administradores.</p>
        </div>
      </DashboardLayout>
    );
  }

  const s = stats as any;
  const t = tenant as any;

  return (
    <DashboardLayout title="Configurações">
      {/* Stats rápidas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pacientes', value: s?.patients?.total || 0, sub: `+${s?.patients?.last_month || 0} este mês` },
          { label: 'Consultas', value: s?.appointments?.total || 0, sub: `${s?.appointments?.completed || 0} realizadas` },
          { label: 'Receita do Mês', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(s?.revenue?.total || '0')), sub: 'Pagamentos confirmados' },
          { label: 'WhatsApp Enviados', value: s?.whatsapp?.total_sent || 0, sub: `${s?.whatsapp?.total_read || 0} lidos` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border p-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: 'var(--text)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Sidebar de tabs */}
        <div className="w-48 flex-shrink-0">
          <div className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm font-medium border-b last:border-0 transition-all"
                style={{
                  borderColor: 'var(--border)',
                  background: activeTab === id ? '#dbeafe' : 'transparent',
                  color: activeTab === id ? '#1d4ed8' : 'var(--text-muted)',
                }}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Plano */}
          <div className="rounded-xl border p-4 mt-4"
            style={{ background: '#d1fae520', borderColor: '#d1fae5' }}>
            <p className="text-xs font-semibold" style={{ color: '#065f46' }}>
              ✅ Plano {t?.subscription_plan?.toUpperCase() || 'TRIAL'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#065f46' }}>
              {t?.subscription_status === 'trial'
                ? `Trial ativo`
                : 'Assinatura ativa'}
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1">
          {activeTab === 'clinic' && <ClinicTab tenant={t} />}
          {activeTab === 'whatsapp' && <WhatsAppTab tenant={t} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'lgpd' && <LgpdTab />}
          {activeTab === 'subscription' && (
            <div className="rounded-xl border p-8 text-center"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <CreditCard size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Gestão de Assinatura</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Integração com Stripe/PagSeguro — em desenvolvimento
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Stethoscope, CheckCircle, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api-complete';

export default function PreRegistrationPage({ params }: { params: { token: string } }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: '', cpf: '', date_of_birth: '',
    address_street: '', address_number: '', address_city: '', address_state: '',
    insurance_name: '', insurance_number: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: preData, isLoading, isError } = useQuery({
    queryKey: ['pre-registration', params.token],
    queryFn: () => api.patients.preRegistration.get(params.token),
  });

  const completeMutation = useMutation({
    mutationFn: (data: any) => api.patients.preRegistration.complete(params.token, data),
    onSuccess: () => setStep(3),
    onError: () => toast.error('Erro ao salvar dados. Tente novamente.'),
  });

  const patient = preData as any;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <p className="text-red-400 text-lg font-semibold">Link inválido ou expirado</p>
          <p className="text-slate-400 mt-2 text-sm">Entre em contato com a clínica para um novo link.</p>
        </div>
      </div>
    );
  }

  if (patient?.pre_registration_completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <p className="text-white text-xl font-bold">Pré-cadastro já realizado!</p>
          <p className="text-slate-400 mt-2">Seus dados já estão registrados. Até logo! 😊</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0ea5e9' }}>
          <Stethoscope size={22} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold">{patient?.clinic_name}</p>
          <p className="text-slate-400 text-xs">Pré-cadastro do paciente</p>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: step >= s ? '#0ea5e9' : '#334155',
                  color: step >= s ? 'white' : '#64748b',
                }}>
                {step > s ? '✓' : s}
              </div>
              {s < 2 && <div className="flex-1 h-0.5" style={{ background: step > s ? '#0ea5e9' : '#334155' }} />}
              <span className="text-xs hidden sm:block" style={{ color: step >= s ? '#94a3b8' : '#475569' }}>
                {s === 1 ? 'Dados Pessoais' : 'Endereço e Convênio'}
              </span>
            </div>
          ))}
        </div>

        {/* Step 3 - Success */}
        {step === 3 && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#1e293b' }}>
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Cadastro concluído!</h2>
            <p className="text-slate-400 text-sm">
              Obrigado, <strong className="text-white">{patient?.full_name}</strong>!
              Seus dados foram registrados com sucesso. Até a sua consulta! 😊
            </p>
          </div>
        )}

        {step !== 3 && (
          <div className="rounded-2xl p-6" style={{ background: '#1e293b' }}>
            <h2 className="text-white font-bold text-lg mb-1">
              Olá, {patient?.full_name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-slate-400 text-sm mb-5">
              Complete seus dados para agilizar o atendimento.
            </p>

            {step === 1 && (
              <div className="space-y-3">
                {[
                  { key: 'full_name', label: 'Nome Completo', placeholder: 'Como consta no documento' },
                  { key: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
                  { key: 'date_of_birth', label: 'Data de Nascimento', type: 'date', placeholder: '' },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="text-xs text-slate-400 mb-1 block">{label}</label>
                    <input
                      type={type || 'text'}
                      value={(form as any)[key]}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-white border outline-none"
                      style={{ background: '#0f172a', borderColor: '#334155' }}
                      onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                      onBlur={(e) => e.target.style.borderColor = '#334155'}
                    />
                  </div>
                ))}
                <button onClick={() => setStep(2)}
                  disabled={!form.full_name}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-2 disabled:opacity-40"
                  style={{ background: '#0ea5e9' }}>
                  Continuar
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Rua / Av.</label>
                    <input value={form.address_street} onChange={(e) => set('address_street', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-white border outline-none"
                      style={{ background: '#0f172a', borderColor: '#334155' }}
                      onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                      onBlur={(e) => e.target.style.borderColor = '#334155'} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Número</label>
                    <input value={form.address_number} onChange={(e) => set('address_number', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-white border outline-none"
                      style={{ background: '#0f172a', borderColor: '#334155' }}
                      onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                      onBlur={(e) => e.target.style.borderColor = '#334155'} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Cidade</label>
                    <input value={form.address_city} onChange={(e) => set('address_city', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-white border outline-none"
                      style={{ background: '#0f172a', borderColor: '#334155' }}
                      onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                      onBlur={(e) => e.target.style.borderColor = '#334155'} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Estado (UF)</label>
                    <input value={form.address_state} onChange={(e) => set('address_state', e.target.value)}
                      placeholder="SP" maxLength={2}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-white border outline-none"
                      style={{ background: '#0f172a', borderColor: '#334155' }}
                      onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                      onBlur={(e) => e.target.style.borderColor = '#334155'} />
                  </div>
                </div>

                <div className="pt-2 border-t" style={{ borderColor: '#334155' }}>
                  <p className="text-xs text-slate-400 mb-2">Convênio (opcional)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.insurance_name} onChange={(e) => set('insurance_name', e.target.value)}
                      placeholder="Nome do plano"
                      className="px-3 py-2.5 rounded-lg text-sm text-white border outline-none"
                      style={{ background: '#0f172a', borderColor: '#334155' }}
                      onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                      onBlur={(e) => e.target.style.borderColor = '#334155'} />
                    <input value={form.insurance_number} onChange={(e) => set('insurance_number', e.target.value)}
                      placeholder="Nº carteirinha"
                      className="px-3 py-2.5 rounded-lg text-sm text-white border outline-none"
                      style={{ background: '#0f172a', borderColor: '#334155' }}
                      onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                      onBlur={(e) => e.target.style.borderColor = '#334155'} />
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button onClick={() => setStep(1)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                    style={{ borderColor: '#334155', color: '#94a3b8' }}>
                    Voltar
                  </button>
                  <button onClick={() => completeMutation.mutate(form)}
                    disabled={completeMutation.isPending}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: '#0ea5e9' }}>
                    {completeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                    Concluir Cadastro
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-slate-600 text-xs text-center mt-4">
          🔒 Seus dados são protegidos pela LGPD e nunca serão compartilhados.
        </p>
      </div>
    </div>
  );
}

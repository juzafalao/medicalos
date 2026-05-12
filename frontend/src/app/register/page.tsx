'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stethoscope, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api-complete';

const schema = z.object({
  clinic_name: z.string().min(2, 'Nome da clínica obrigatório'),
  slug:        z.string().min(3).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  full_name:   z.string().min(2, 'Seu nome é obrigatório'),
  email:       z.string().email('Email inválido'),
  password:    z.string().min(8, 'Mínimo 8 caracteres'),
  phone:       z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [done, setDone] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.auth.register(data);
      setDone(true);
      toast.success('Clínica cadastrada! Trial de 14 dias ativado.');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao cadastrar. Verifique os dados.');
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none transition-all";
  const inputStyle = { background: '#0f172a', border: '1px solid #334155' };
  const onFocus = (e: any) => (e.target.style.borderColor = '#0ea5e9');
  const onBlur  = (e: any) => (e.target.style.borderColor = '#334155');

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <CheckCircle size={56} className="mx-auto mb-4" style={{ color: '#10b981' }} />
          <h2 className="text-white text-2xl font-bold mb-2">Clínica criada com sucesso!</h2>
          <p className="text-slate-400">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0f172a' }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0ea5e9' }}>
            <Stethoscope size={22} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">MedicalOS</span>
        </div>

        <div className="rounded-2xl p-8 border" style={{ background: '#1e293b', borderColor: '#334155' }}>
          <h2 className="text-2xl font-bold text-white mb-1">Cadastrar Clínica</h2>
          <p className="text-slate-400 text-sm mb-6">Trial gratuito de 14 dias. Sem cartão de crédito.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Nome da Clínica</label>
              <input {...register('clinic_name')} placeholder="Ex: Clínica São Lucas"
                className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              {errors.clinic_name && <p className="text-red-400 text-xs mt-1">{errors.clinic_name.message}</p>}
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Identificador único{' '}
                <span className="text-slate-500">(usado no login)</span>
              </label>
              <input {...register('slug')} placeholder="ex: clinica-sao-lucas"
                className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug.message}</p>}
              {watch('slug') && (
                <p className="text-slate-500 text-xs mt-1">
                  Login: <span className="text-slate-300 font-mono">{watch('slug')}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Seu Nome</label>
                <input {...register('full_name')} placeholder="Dr. João Silva"
                  className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Telefone</label>
                <input {...register('phone')} placeholder="(11) 99999-0000"
                  className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <input {...register('email')} type="email" placeholder="admin@suaclinica.com.br"
                className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Senha</label>
              <input {...register('password')} type="password" placeholder="Mínimo 8 caracteres"
                className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
              style={{ background: '#0ea5e9' }}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              Criar Clínica Gratuitamente
            </button>
          </form>

          <div className="mt-4 pt-4 border-t text-center" style={{ borderColor: '#334155' }}>
            <p className="text-slate-400 text-sm">
              Já tem conta?{' '}
              <a href="/login" style={{ color: '#0ea5e9' }} className="hover:underline">
                Fazer login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

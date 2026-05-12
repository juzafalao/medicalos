'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stethoscope, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth.store';

const schema = z.object({
  tenant_slug: z.string().min(1, 'Informe o identificador da clínica'),
  email:       z.string().email('Email inválido'),
  password:    z.string().min(6, 'Mínimo 6 caracteres'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuthStore();

  // Já logado → redireciona
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password, data.tenant_slug);
      toast.success('Bem-vindo ao MedicalOS!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Credenciais inválidas');
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none transition-all";
  const inputStyle = { background: '#0f172a', border: '1px solid #334155' };
  const onFocus = (e: any) => (e.target.style.borderColor = '#0ea5e9');
  const onBlur  = (e: any) => (e.target.style.borderColor = '#334155');

  return (
    <div className="min-h-screen flex" style={{ background: '#0f172a' }}>
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#0ea5e9' }}>
            <Stethoscope size={22} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">MedicalOS</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Gestão clínica inteligente para clínicas modernas
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            Automação, WhatsApp nativo e experiência superior para seus pacientes.
          </p>
          {[
            { value: '35%', label: 'Redução de no-show com automação' },
            { value: '20h', label: 'Economia mensal para a recepção' },
            { value: '100%', label: 'Conformidade com a LGPD' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-4 mb-4">
              <span className="text-2xl font-bold" style={{ color: '#0ea5e9' }}>{s.value}</span>
              <span className="text-slate-300 text-sm">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} MedicalOS.</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0ea5e9' }}>
              <Stethoscope size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">MedicalOS</span>
          </div>

          <div className="rounded-2xl p-8 border" style={{ background: '#1e293b', borderColor: '#334155' }}>
            <h2 className="text-2xl font-bold text-white mb-1">Entrar</h2>
            <p className="text-slate-400 text-sm mb-6">Acesse o painel da sua clínica</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Identificador da Clínica</label>
                <input {...register('tenant_slug')} placeholder="ex: minha-clinica"
                  className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                {errors.tenant_slug && <p className="text-red-400 text-xs mt-1">{errors.tenant_slug.message}</p>}
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Email</label>
                <input {...register('email')} type="email" placeholder="seu@email.com"
                  className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Senha</label>
                <div className="relative">
                  <input {...register('password')} type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••" className={inputClass + ' pr-10'} style={inputStyle}
                    onFocus={onFocus} onBlur={onBlur} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-2.5 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: '#0ea5e9' }}>
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Entrar'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t text-center" style={{ borderColor: '#334155' }}>
              <p className="text-slate-400 text-sm">
                Ainda não tem conta?{' '}
                <a href="/register" style={{ color: '#0ea5e9' }} className="hover:underline">
                  Cadastre sua clínica
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

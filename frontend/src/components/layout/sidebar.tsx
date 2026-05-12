'use client';
// ============================================================
// components/layout/sidebar.tsx - Sidebar de navegação
// ============================================================
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Calendar, Users, FileText, MessageSquare,
  DollarSign, Settings, LogOut, Stethoscope, ChevronRight,
  Bell, Search,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { clsx } from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'receptionist', 'financial'] },
  { href: '/dashboard/agenda', label: 'Agenda', icon: Calendar, roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/dashboard/pacientes', label: 'Pacientes', icon: Users, roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/dashboard/prontuarios', label: 'Prontuários', icon: FileText, roles: ['admin', 'doctor'] },
  { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageSquare, roles: ['admin', 'receptionist'] },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: DollarSign, roles: ['admin', 'financial', 'receptionist'] },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const filtered = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-50"
      style={{ background: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--primary)' }}>
          <Stethoscope size={20} className="text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-lg tracking-tight">MedicalOS</span>
          <p className="text-xs text-slate-400">Gestão Clínica</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filtered.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
              style={isActive ? { background: 'var(--primary)', color: 'white' } : {}}>
              <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
              {item.label}
              {isActive && <ChevronRight size={14} className="ml-auto text-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--accent)' }}>
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
          </div>
          <button onClick={logout}
            className="p-1 text-slate-400 hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ============================================================
// components/layout/dashboard-layout.tsx
// ============================================================
export function DashboardLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <main className="flex-1 ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-40 border-b px-6 py-3 flex items-center justify-between"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {title}
          </h1>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg transition-colors hover:bg-slate-100"
              style={{ color: 'var(--text-muted)' }}>
              <Search size={18} />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-slate-100 relative"
              style={{ color: 'var(--text-muted)' }}>
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

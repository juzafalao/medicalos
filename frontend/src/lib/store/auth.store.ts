// ============================================================
// lib/store/auth.store.ts — VERSÃO FINAL
// ============================================================
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'financial';
  tenant_id: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, tenantSlug: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password, tenantSlug) => {
        set({ isLoading: true });
        try {
          const { default: api } = await import('../api-complete');
          const res: any = await api.auth.login({ email, password, tenant_slug: tenantSlug });
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('refresh_token', res.refresh_token);
          localStorage.setItem('user_id', res.user.id);
          setCookie('medicalos_session', res.access_token);
          set({ user: res.user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          const { default: api } = await import('../api-complete');
          await api.auth.logout();
        } catch {}
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        deleteCookie('medicalos_session');
        set({ user: null, isAuthenticated: false });
        window.location.href = '/login';
      },

      setUser: (user) => set({ user, isAuthenticated: true }),
    }),
    {
      name: 'medicalos-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
);

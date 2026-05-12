// ============================================================
// hooks/useAuth.ts — Proteção client-side + redirect
// ============================================================
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';

type Role = 'admin' | 'doctor' | 'receptionist' | 'financial';

export function useAuth(requiredRoles?: Role[]) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (requiredRoles && !requiredRoles.includes(user.role as Role)) {
      router.replace('/dashboard'); // redireciona para home sem acesso
    }
  }, [isAuthenticated, user, router]);

  return { user, isAuthenticated };
}

// ============================================================
// hooks/useDebounce.ts — Debounce para buscas
// ============================================================
import { useState, useEffect as useEffectDebounce } from 'react';

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffectDebounce(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ============================================================
// hooks/useTenant.ts — Dados da clínica logada
// ============================================================
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-complete';

export function useTenant() {
  return useQuery({
    queryKey: ['tenant-me'],
    queryFn: () => api.tenants.getMe(),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// hooks/useDoctors.ts — Lista de médicos da clínica
// ============================================================
export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.users.doctors(),
    staleTime: 2 * 60 * 1000,
    select: (data: any) => (Array.isArray(data) ? data : []),
  });
}

// ============================================================
// hooks/useRooms.ts — Salas de atendimento
// ============================================================
export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.rooms.list(),
    staleTime: 10 * 60 * 1000,
    select: (data: any) => (Array.isArray(data) ? data : []),
  });
}

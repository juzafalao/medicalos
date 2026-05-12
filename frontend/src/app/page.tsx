// app/page.tsx — Redireciona raiz para /dashboard ou /login
import { redirect } from 'next/navigation';

export default function RootPage() {
  // O middleware já faz o redirect, mas mantemos como fallback
  redirect('/login');
}

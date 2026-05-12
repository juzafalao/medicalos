// app/login/page.tsx — Alias conveniente para /auth/login
import { redirect } from 'next/navigation';

export default function LoginRedirect() {
  redirect('/auth/login');
}

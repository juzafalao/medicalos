// ============================================================
// middleware.ts — Proteção de rotas /dashboard
// ============================================================
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/pre-cadastro',
  '/api',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite rotas públicas
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Verifica token no cookie (o frontend salva no localStorage,
  // mas para SSR usamos cookie httpOnly no futuro;
  // por enquanto redireciona para login se não tiver cookie de sessão)
  const token = request.cookies.get('medicalos_session')?.value;

  // Se acessar /dashboard sem sessão → redireciona para login
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redireciona raiz para dashboard ou login
  if (pathname === '/') {
    if (token) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};

// ============================================================
// middleware.ts — Proteção de rotas /dashboard com validação de JWT
// ============================================================
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/pre-cadastro',
  '/api',
];

function isTokenExpired(token: string): boolean {
  try {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return true;
    const payload = JSON.parse(
      Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'),
    );
    if (!payload.exp) return true;
    // 30 segundos de tolerância para clock skew
    return Date.now() / 1000 > payload.exp - 30;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get('medicalos_session')?.value;

  if (pathname.startsWith('/dashboard')) {
    // Redireciona se não tiver cookie ou se o JWT estiver expirado
    if (!token || isTokenExpired(token)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      const response = NextResponse.redirect(loginUrl);
      // Remove o cookie expirado para não poluir
      if (token) response.cookies.delete('medicalos_session');
      return response;
    }
  }

  if (pathname === '/') {
    if (token && !isTokenExpired(token)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};

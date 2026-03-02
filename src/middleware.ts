import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const RAW_SECRET = process.env.JWT_SECRET ?? 'fallback-dev-secret-min-32-chars';
const secret = new TextEncoder().encode(RAW_SECRET);
const ALG = 'HS256';

async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [ALG],
    });
    return payload && (payload as any).admin === true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin API routes (except login)
  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/login') {
      return NextResponse.next();
    }
    const ok = await isAdminAuthenticated(request);
    if (!ok) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protect admin pages (except /admin login page)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin') {
      return NextResponse.next();
    }
    const ok = await isAdminAuthenticated(request);
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

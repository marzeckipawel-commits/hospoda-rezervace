export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/jwt';

const bodySchema = z.object({
  password: z.string(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: 'admin_not_configured' }, { status: 500 });
  }
  if (parsed.data.password !== adminPassword) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
  }
  const token = await signAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return res;
}

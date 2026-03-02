import { SignJWT, jwtVerify } from 'jose';

const RAW_SECRET = process.env.JWT_SECRET ?? 'fallback-dev-secret-min-32-chars';
const secret = new TextEncoder().encode(RAW_SECRET);
const ALG = 'HS256';

export async function signAdminToken(): Promise<string> {
  return await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: ALG, typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<any> {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: [ALG],
  });
  return payload;
}

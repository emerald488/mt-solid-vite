import { createMiddleware } from 'hono/factory';
import * as jose from 'jose';
import bcrypt from 'bcryptjs';

type Variables = {
  userId: string;
};

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const header = c.req.header('Authorization');

  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = header.slice(7);

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload.sub) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    c.set('userId', payload.sub);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// Helper для создания JWT
export async function createToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  return await new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

// Хэширование пароля с bcrypt (совместимость с прошлым проектом)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Проверка пароля - поддержка bcrypt и legacy SHA-256
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // bcrypt хеши начинаются с $2a$, $2b$ или $2y$
  if (hash.startsWith('$2')) {
    return bcrypt.compare(password, hash);
  }

  // Legacy SHA-256 хеши (для обратной совместимости)
  const encoder = new TextEncoder();
  const data = encoder.encode(password + process.env.JWT_SECRET);
  const sha256Hash = await crypto.subtle.digest('SHA-256', data);
  const legacyHash = btoa(String.fromCharCode(...new Uint8Array(sha256Hash)));
  return legacyHash === hash;
}

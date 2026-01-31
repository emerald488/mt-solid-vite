import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, users } from '../db';
import { createToken, hashPassword, verifyPassword } from '../middleware/auth';

const app = new Hono();

// POST /auth/register
app.post('/register', async (c) => {
  try {
    const { email, password, displayCurrency } = await c.req.json<{
      email: string;
      password: string;
      displayCurrency?: string;
    }>();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Проверка существующего пользователя
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Создание пользователя
    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        displayCurrency: displayCurrency || 'RUB',
      })
      .returning({ id: users.id, email: users.email, displayCurrency: users.displayCurrency });

    const token = await createToken(user.id);

    return c.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayCurrency: user.displayCurrency,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// POST /auth/login
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json<{
      email: string;
      password: string;
    }>();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Поиск пользователя
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Проверка пароля
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = await createToken(user.id);

    return c.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayCurrency: user.displayCurrency,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// GET /auth/me (protected - вызывается с authMiddleware)
app.get('/me', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        displayCurrency: users.displayCurrency,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId as string))
      .limit(1);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ data: user });
  } catch (error) {
    console.error('Get me error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

export default app;

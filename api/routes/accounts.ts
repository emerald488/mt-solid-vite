import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, accounts, type NewAccount } from '../db';

type Variables = { userId: string };

const app = new Hono<{ Variables: Variables }>();

// GET /accounts - список счетов
app.get('/', async (c) => {
  try {
    const userId = c.get('userId');

    const result = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(accounts.createdAt);

    return c.json({ data: result, total: result.length });
  } catch (error) {
    console.error('Get accounts error:', error);
    return c.json({ error: 'Failed to get accounts' }, 500);
  }
});

// GET /accounts/:id - один счёт
app.get('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .limit(1);

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    return c.json({ data: account });
  } catch (error) {
    console.error('Get account error:', error);
    return c.json({ error: 'Failed to get account' }, 500);
  }
});

// POST /accounts - создать счёт
app.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<Partial<NewAccount>>();

    if (!body.name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const [account] = await db
      .insert(accounts)
      .values({
        userId,
        name: body.name,
        type: body.type || 'manual',
        currency: body.currency || 'RUB',
        balance: body.balance || '0',
        walletAddress: body.walletAddress,
        blockchain: body.blockchain,
        icon: body.icon || 'wallet',
        color: body.color || '#3b82f6',
      })
      .returning();

    return c.json({ data: account }, 201);
  } catch (error) {
    console.error('Create account error:', error);
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

// PUT /accounts/:id - обновить счёт
app.put('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json<Partial<NewAccount>>();

    // Проверка владельца
    const [existing] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Account not found' }, 404);
    }

    const [account] = await db
      .update(accounts)
      .set({
        name: body.name,
        type: body.type,
        currency: body.currency,
        balance: body.balance,
        walletAddress: body.walletAddress,
        blockchain: body.blockchain,
        lastSyncedAt: body.lastSyncedAt,
        icon: body.icon,
        color: body.color,
      })
      .where(eq(accounts.id, id))
      .returning();

    return c.json({ data: account });
  } catch (error) {
    console.error('Update account error:', error);
    return c.json({ error: 'Failed to update account' }, 500);
  }
});

// DELETE /accounts/:id - удалить счёт
app.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    // Проверка владельца
    const [existing] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Account not found' }, 404);
    }

    await db.delete(accounts).where(eq(accounts.id, id));

    return c.json({ data: { success: true } });
  } catch (error) {
    console.error('Delete account error:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

export default app;

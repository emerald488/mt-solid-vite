import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, goals, accounts, type NewGoal } from '../db';

type Variables = { userId: string };

const app = new Hono<{ Variables: Variables }>();

// GET /goals - список целей
app.get('/', async (c) => {
  try {
    const userId = c.get('userId');

    const result = await db
      .select({
        id: goals.id,
        userId: goals.userId,
        accountId: goals.accountId,
        name: goals.name,
        targetAmount: goals.targetAmount,
        createdAt: goals.createdAt,
        accountName: accounts.name,
        accountBalance: accounts.balance,
        accountCurrency: accounts.currency,
        accountIcon: accounts.icon,
        accountColor: accounts.color,
      })
      .from(goals)
      .innerJoin(accounts, eq(goals.accountId, accounts.id))
      .where(eq(goals.userId, userId))
      .orderBy(goals.createdAt);

    // Рассчитываем прогресс
    const goalsWithProgress = result.map((g) => ({
      id: g.id,
      userId: g.userId,
      accountId: g.accountId,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.accountBalance,
      currency: g.accountCurrency,
      progress: Math.min(
        100,
        (parseFloat(g.accountBalance) / parseFloat(g.targetAmount)) * 100
      ),
      createdAt: g.createdAt,
      account: {
        id: g.accountId,
        name: g.accountName,
        balance: g.accountBalance,
        currency: g.accountCurrency,
        icon: g.accountIcon,
        color: g.accountColor,
      },
    }));

    return c.json({ data: goalsWithProgress, total: goalsWithProgress.length });
  } catch (error) {
    console.error('Get goals error:', error);
    return c.json({ error: 'Failed to get goals' }, 500);
  }
});

// GET /goals/:id
app.get('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const [goal] = await db
      .select({
        id: goals.id,
        userId: goals.userId,
        accountId: goals.accountId,
        name: goals.name,
        targetAmount: goals.targetAmount,
        createdAt: goals.createdAt,
        accountName: accounts.name,
        accountBalance: accounts.balance,
        accountCurrency: accounts.currency,
      })
      .from(goals)
      .innerJoin(accounts, eq(goals.accountId, accounts.id))
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .limit(1);

    if (!goal) {
      return c.json({ error: 'Goal not found' }, 404);
    }

    return c.json({
      data: {
        ...goal,
        currentAmount: goal.accountBalance,
        currency: goal.accountCurrency,
        progress: Math.min(
          100,
          (parseFloat(goal.accountBalance) / parseFloat(goal.targetAmount)) * 100
        ),
      },
    });
  } catch (error) {
    console.error('Get goal error:', error);
    return c.json({ error: 'Failed to get goal' }, 500);
  }
});

// POST /goals - создать цель
app.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<Partial<NewGoal>>();

    if (!body.accountId || !body.name || !body.targetAmount) {
      return c.json({ error: 'accountId, name, targetAmount are required' }, 400);
    }

    // Проверяем что счёт принадлежит пользователю
    const [account] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, body.accountId), eq(accounts.userId, userId)))
      .limit(1);

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    const [goal] = await db
      .insert(goals)
      .values({
        userId,
        accountId: body.accountId,
        name: body.name,
        targetAmount: body.targetAmount,
      })
      .returning();

    return c.json({ data: goal }, 201);
  } catch (error) {
    console.error('Create goal error:', error);
    return c.json({ error: 'Failed to create goal' }, 500);
  }
});

// PUT /goals/:id - обновить цель
app.put('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json<Partial<NewGoal>>();

    const [existing] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Goal not found' }, 404);
    }

    // Если меняется счёт, проверяем владельца
    if (body.accountId) {
      const [account] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.id, body.accountId), eq(accounts.userId, userId)))
        .limit(1);

      if (!account) {
        return c.json({ error: 'Account not found' }, 404);
      }
    }

    const [goal] = await db
      .update(goals)
      .set({
        accountId: body.accountId,
        name: body.name,
        targetAmount: body.targetAmount,
      })
      .where(eq(goals.id, id))
      .returning();

    return c.json({ data: goal });
  } catch (error) {
    console.error('Update goal error:', error);
    return c.json({ error: 'Failed to update goal' }, 500);
  }
});

// DELETE /goals/:id - удалить цель
app.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const [existing] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Goal not found' }, 404);
    }

    await db.delete(goals).where(eq(goals.id, id));

    return c.json({ data: { success: true } });
  } catch (error) {
    console.error('Delete goal error:', error);
    return c.json({ error: 'Failed to delete goal' }, 500);
  }
});

export default app;

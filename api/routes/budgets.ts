import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, budgets, tags, type NewBudget } from '../db';

type Variables = { userId: string };

const app = new Hono<{ Variables: Variables }>();

// GET /budgets - список бюджетов
app.get('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { month } = c.req.query();

    const conditions = [eq(budgets.userId, userId)];

    if (month) {
      conditions.push(eq(budgets.month, month));
    }

    const result = await db
      .select({
        id: budgets.id,
        userId: budgets.userId,
        tagId: budgets.tagId,
        amount: budgets.amount,
        month: budgets.month,
        tagName: tags.name,
        tagColor: tags.color,
        tagIcon: tags.icon,
      })
      .from(budgets)
      .innerJoin(tags, eq(budgets.tagId, tags.id))
      .where(and(...conditions))
      .orderBy(tags.name);

    return c.json({ data: result, total: result.length });
  } catch (error) {
    console.error('Get budgets error:', error);
    return c.json({ error: 'Failed to get budgets' }, 500);
  }
});

// POST /budgets - создать/обновить бюджет
app.post('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json<Partial<NewBudget>>();

    if (!body.tagId || !body.amount || !body.month) {
      return c.json({ error: 'tagId, amount, month are required' }, 400);
    }

    // Проверяем что тег принадлежит пользователю
    const [tag] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.id, body.tagId), eq(tags.userId, userId)))
      .limit(1);

    if (!tag) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    // Проверяем существующий бюджет
    const [existing] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.tagId, body.tagId),
          eq(budgets.month, body.month)
        )
      )
      .limit(1);

    let budget;

    if (existing) {
      // Обновляем существующий
      [budget] = await db
        .update(budgets)
        .set({ amount: body.amount })
        .where(eq(budgets.id, existing.id))
        .returning();
    } else {
      // Создаём новый
      [budget] = await db
        .insert(budgets)
        .values({
          userId,
          tagId: body.tagId,
          amount: body.amount,
          month: body.month,
        })
        .returning();
    }

    return c.json({ data: budget }, existing ? 200 : 201);
  } catch (error) {
    console.error('Create budget error:', error);
    return c.json({ error: 'Failed to create budget' }, 500);
  }
});

// DELETE /budgets/:id - удалить бюджет
app.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const id = c.req.param('id');

    const [existing] = await db
      .select({ id: budgets.id })
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Budget not found' }, 404);
    }

    await db.delete(budgets).where(eq(budgets.id, id));

    return c.json({ data: { success: true } });
  } catch (error) {
    console.error('Delete budget error:', error);
    return c.json({ error: 'Failed to delete budget' }, 500);
  }
});

export default app;

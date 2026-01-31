import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, tags, type NewTag } from '../db';

type Variables = { userId: string };

const app = new Hono<{ Variables: Variables }>();

// GET /tags - список тегов
app.get('/', async (c) => {
  try {
    const userId = c.get('userId');

    const result = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId))
      .orderBy(tags.name);

    return c.json({ data: result, total: result.length });
  } catch (error) {
    console.error('Get tags error:', error);
    return c.json({ error: 'Failed to get tags' }, 500);
  }
});

// GET /tags/:id
app.get('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const [tag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .limit(1);

    if (!tag) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    return c.json({ data: tag });
  } catch (error) {
    console.error('Get tag error:', error);
    return c.json({ error: 'Failed to get tag' }, 500);
  }
});

// POST /tags - создать тег
app.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<Partial<NewTag>>();

    if (!body.name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    // Проверка уникальности имени для пользователя
    const [existing] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, body.name)))
      .limit(1);

    if (existing) {
      return c.json({ error: 'Tag with this name already exists' }, 400);
    }

    const [tag] = await db
      .insert(tags)
      .values({
        userId,
        name: body.name,
        color: body.color || '#6b7280',
        icon: body.icon || 'tag',
      })
      .returning();

    return c.json({ data: tag }, 201);
  } catch (error) {
    console.error('Create tag error:', error);
    return c.json({ error: 'Failed to create tag' }, 500);
  }
});

// PUT /tags/:id - обновить тег
app.put('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json<Partial<NewTag>>();

    // Проверка владельца
    const [existing] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    // Проверка уникальности имени (если меняется)
    if (body.name) {
      const [duplicate] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.userId, userId), eq(tags.name, body.name)))
        .limit(1);

      if (duplicate && duplicate.id !== id) {
        return c.json({ error: 'Tag with this name already exists' }, 400);
      }
    }

    const [tag] = await db
      .update(tags)
      .set({
        name: body.name,
        color: body.color,
        icon: body.icon,
      })
      .where(eq(tags.id, id))
      .returning();

    return c.json({ data: tag });
  } catch (error) {
    console.error('Update tag error:', error);
    return c.json({ error: 'Failed to update tag' }, 500);
  }
});

// DELETE /tags/:id - удалить тег
app.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    // Проверка владельца
    const [existing] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    await db.delete(tags).where(eq(tags.id, id));

    return c.json({ data: { success: true } });
  } catch (error) {
    console.error('Delete tag error:', error);
    return c.json({ error: 'Failed to delete tag' }, 500);
  }
});

export default app;

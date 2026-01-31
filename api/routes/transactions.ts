import { Hono } from 'hono';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db, transactions, transactionTags, accounts, tags, type NewTransaction } from '../db';

type Variables = { userId: string };

const app = new Hono<{ Variables: Variables }>();

// GET /transactions - список с фильтрами
app.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const { from, to, account_id, tag_id, type, limit = '50', offset = '0' } = c.req.query();

    const conditions = [eq(transactions.userId, userId)];

    if (from) {
      conditions.push(gte(transactions.date, from));
    }
    if (to) {
      conditions.push(lte(transactions.date, to));
    }
    if (account_id) {
      conditions.push(eq(transactions.accountId, account_id));
    }
    if (type) {
      conditions.push(eq(transactions.type, type));
    }

    let query = db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const result = await query;

    // Получаем теги для транзакций
    const transactionIds = result.map((t) => t.id);

    let transactionsWithTags = result;

    if (transactionIds.length > 0) {
      const tagLinks = await db
        .select({
          transactionId: transactionTags.transactionId,
          tagId: transactionTags.tagId,
          tagName: tags.name,
          tagColor: tags.color,
          tagIcon: tags.icon,
        })
        .from(transactionTags)
        .innerJoin(tags, eq(transactionTags.tagId, tags.id))
        .where(sql`${transactionTags.transactionId} IN ${transactionIds}`);

      const tagsByTransaction = tagLinks.reduce(
        (acc, link) => {
          if (!acc[link.transactionId]) {
            acc[link.transactionId] = [];
          }
          acc[link.transactionId].push({
            id: link.tagId,
            name: link.tagName,
            color: link.tagColor,
            icon: link.tagIcon,
          });
          return acc;
        },
        {} as Record<string, Array<{ id: string; name: string; color: string; icon: string }>>
      );

      transactionsWithTags = result.map((t) => ({
        ...t,
        tags: tagsByTransaction[t.id] || [],
      }));
    }

    // Фильтр по тегу (если указан)
    if (tag_id) {
      transactionsWithTags = transactionsWithTags.filter((t: any) =>
        t.tags?.some((tag: any) => tag.id === tag_id)
      );
    }

    // Общее количество
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(...conditions));

    return c.json({ data: transactionsWithTags, total: Number(count) });
  } catch (error) {
    console.error('Get transactions error:', error);
    return c.json({ error: 'Failed to get transactions' }, 500);
  }
});

// GET /transactions/:id
app.get('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    // Получаем теги
    const tagLinks = await db
      .select({
        tagId: transactionTags.tagId,
        tagName: tags.name,
        tagColor: tags.color,
        tagIcon: tags.icon,
      })
      .from(transactionTags)
      .innerJoin(tags, eq(transactionTags.tagId, tags.id))
      .where(eq(transactionTags.transactionId, id));

    return c.json({
      data: {
        ...transaction,
        tags: tagLinks.map((l) => ({
          id: l.tagId,
          name: l.tagName,
          color: l.tagColor,
          icon: l.tagIcon,
        })),
      },
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    return c.json({ error: 'Failed to get transaction' }, 500);
  }
});

// POST /transactions - создать транзакцию
app.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<
      Partial<NewTransaction> & { tagIds?: string[] }
    >();

    if (!body.accountId || !body.type || !body.amount || !body.currency) {
      return c.json({ error: 'accountId, type, amount, currency are required' }, 400);
    }

    // Проверяем что счёт принадлежит пользователю
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, body.accountId), eq(accounts.userId, userId)))
      .limit(1);

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Создаём транзакцию
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        accountId: body.accountId,
        type: body.type,
        amount: body.amount,
        currency: body.currency,
        targetAccountId: body.targetAccountId,
        targetAmount: body.targetAmount,
        description: body.description,
        date: body.date || new Date().toISOString().split('T')[0],
      })
      .returning();

    // Обновляем баланс счёта
    const amountNum = parseFloat(body.amount);
    let newBalance = parseFloat(account.balance);

    if (body.type === 'income') {
      newBalance += amountNum;
    } else if (body.type === 'expense') {
      newBalance -= amountNum;
    } else if (body.type === 'transfer' && body.targetAccountId) {
      // Списываем с исходного счёта
      newBalance -= amountNum;

      // Зачисляем на целевой счёт
      const targetAmount = body.targetAmount ? parseFloat(body.targetAmount) : amountNum;
      await db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${targetAmount}` })
        .where(eq(accounts.id, body.targetAccountId));
    }

    await db
      .update(accounts)
      .set({ balance: newBalance.toString() })
      .where(eq(accounts.id, body.accountId));

    // Добавляем теги
    if (body.tagIds && body.tagIds.length > 0) {
      await db.insert(transactionTags).values(
        body.tagIds.map((tagId) => ({
          transactionId: transaction.id,
          tagId,
        }))
      );
    }

    return c.json({ data: transaction }, 201);
  } catch (error) {
    console.error('Create transaction error:', error);
    return c.json({ error: 'Failed to create transaction' }, 500);
  }
});

// PUT /transactions/:id
app.put('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json<
      Partial<NewTransaction> & { tagIds?: string[] }
    >();

    // Проверка владельца
    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    // Обновляем транзакцию
    const [transaction] = await db
      .update(transactions)
      .set({
        accountId: body.accountId,
        type: body.type,
        amount: body.amount,
        currency: body.currency,
        targetAccountId: body.targetAccountId,
        targetAmount: body.targetAmount,
        description: body.description,
        date: body.date,
      })
      .where(eq(transactions.id, id))
      .returning();

    // Обновляем теги если переданы
    if (body.tagIds !== undefined) {
      await db.delete(transactionTags).where(eq(transactionTags.transactionId, id));

      if (body.tagIds.length > 0) {
        await db.insert(transactionTags).values(
          body.tagIds.map((tagId) => ({
            transactionId: id,
            tagId,
          }))
        );
      }
    }

    return c.json({ data: transaction });
  } catch (error) {
    console.error('Update transaction error:', error);
    return c.json({ error: 'Failed to update transaction' }, 500);
  }
});

// DELETE /transactions/:id
app.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    // Получаем транзакцию для отката баланса
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    // Откатываем баланс
    const amountNum = parseFloat(transaction.amount);

    if (transaction.type === 'income') {
      await db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${amountNum}` })
        .where(eq(accounts.id, transaction.accountId));
    } else if (transaction.type === 'expense') {
      await db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${amountNum}` })
        .where(eq(accounts.id, transaction.accountId));
    } else if (transaction.type === 'transfer' && transaction.targetAccountId) {
      // Возвращаем на исходный счёт
      await db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${amountNum}` })
        .where(eq(accounts.id, transaction.accountId));

      // Списываем с целевого
      const targetAmount = transaction.targetAmount ? parseFloat(transaction.targetAmount) : amountNum;
      await db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${targetAmount}` })
        .where(eq(accounts.id, transaction.targetAccountId));
    }

    // Удаляем транзакцию (теги удалятся каскадно)
    await db.delete(transactions).where(eq(transactions.id, id));

    return c.json({ data: { success: true } });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return c.json({ error: 'Failed to delete transaction' }, 500);
  }
});

export default app;

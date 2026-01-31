import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import {
  db,
  recurringPayments,
  recurringPaymentTags,
  transactions,
  accounts,
  tags,
  type NewRecurringPayment,
} from '../db';

type Variables = { userId: string };

const app = new Hono<{ Variables: Variables }>();

// GET /recurring-payments - список
app.get('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { active } = c.req.query();

    const conditions = [eq(recurringPayments.userId, userId)];

    if (active === 'true') {
      conditions.push(eq(recurringPayments.isActive, true));
    } else if (active === 'false') {
      conditions.push(eq(recurringPayments.isActive, false));
    }

    const result = await db
      .select({
        id: recurringPayments.id,
        userId: recurringPayments.userId,
        accountId: recurringPayments.accountId,
        type: recurringPayments.type,
        amount: recurringPayments.amount,
        description: recurringPayments.description,
        frequency: recurringPayments.frequency,
        nextDate: recurringPayments.nextDate,
        isActive: recurringPayments.isActive,
        createdAt: recurringPayments.createdAt,
        accountName: accounts.name,
        accountCurrency: accounts.currency,
      })
      .from(recurringPayments)
      .innerJoin(accounts, eq(recurringPayments.accountId, accounts.id))
      .where(and(...conditions))
      .orderBy(recurringPayments.nextDate);

    // Получаем теги
    const paymentIds = result.map((p) => p.id);

    let paymentsWithTags = result;

    if (paymentIds.length > 0) {
      const tagLinks = await db
        .select({
          paymentId: recurringPaymentTags.recurringPaymentId,
          tagId: recurringPaymentTags.tagId,
          tagName: tags.name,
          tagColor: tags.color,
          tagIcon: tags.icon,
        })
        .from(recurringPaymentTags)
        .innerJoin(tags, eq(recurringPaymentTags.tagId, tags.id))
        .where(sql`${recurringPaymentTags.recurringPaymentId} IN ${paymentIds}`);

      const tagsByPayment = tagLinks.reduce(
        (acc, link) => {
          if (!acc[link.paymentId]) {
            acc[link.paymentId] = [];
          }
          acc[link.paymentId].push({
            id: link.tagId,
            name: link.tagName,
            color: link.tagColor,
            icon: link.tagIcon,
          });
          return acc;
        },
        {} as Record<string, Array<{ id: string; name: string; color: string; icon: string }>>
      );

      paymentsWithTags = result.map((p) => ({
        ...p,
        tags: tagsByPayment[p.id] || [],
      }));
    }

    return c.json({ data: paymentsWithTags, total: paymentsWithTags.length });
  } catch (error) {
    console.error('Get recurring payments error:', error);
    return c.json({ error: 'Failed to get recurring payments' }, 500);
  }
});

// POST /recurring-payments - создать
app.post('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json<
      Partial<NewRecurringPayment> & { tagIds?: string[] }
    >();

    if (!body.accountId || !body.type || !body.amount || !body.frequency || !body.nextDate) {
      return c.json(
        { error: 'accountId, type, amount, frequency, nextDate are required' },
        400
      );
    }

    // Проверяем владельца счёта
    const [account] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, body.accountId), eq(accounts.userId, userId)))
      .limit(1);

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    const [payment] = await db
      .insert(recurringPayments)
      .values({
        userId,
        accountId: body.accountId,
        type: body.type,
        amount: body.amount,
        description: body.description,
        frequency: body.frequency,
        nextDate: body.nextDate,
        isActive: body.isActive ?? true,
      })
      .returning();

    // Добавляем теги
    if (body.tagIds && body.tagIds.length > 0) {
      await db.insert(recurringPaymentTags).values(
        body.tagIds.map((tagId) => ({
          recurringPaymentId: payment.id,
          tagId,
        }))
      );
    }

    return c.json({ data: payment }, 201);
  } catch (error) {
    console.error('Create recurring payment error:', error);
    return c.json({ error: 'Failed to create recurring payment' }, 500);
  }
});

// PUT /recurring-payments/:id - обновить
app.put('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const id = c.req.param('id');
    const body = await c.req.json<
      Partial<NewRecurringPayment> & { tagIds?: string[] }
    >();

    const [existing] = await db
      .select({ id: recurringPayments.id })
      .from(recurringPayments)
      .where(and(eq(recurringPayments.id, id), eq(recurringPayments.userId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Recurring payment not found' }, 404);
    }

    const [payment] = await db
      .update(recurringPayments)
      .set({
        accountId: body.accountId,
        type: body.type,
        amount: body.amount,
        description: body.description,
        frequency: body.frequency,
        nextDate: body.nextDate,
        isActive: body.isActive,
      })
      .where(eq(recurringPayments.id, id))
      .returning();

    // Обновляем теги
    if (body.tagIds !== undefined) {
      await db
        .delete(recurringPaymentTags)
        .where(eq(recurringPaymentTags.recurringPaymentId, id));

      if (body.tagIds.length > 0) {
        await db.insert(recurringPaymentTags).values(
          body.tagIds.map((tagId) => ({
            recurringPaymentId: id,
            tagId,
          }))
        );
      }
    }

    return c.json({ data: payment });
  } catch (error) {
    console.error('Update recurring payment error:', error);
    return c.json({ error: 'Failed to update recurring payment' }, 500);
  }
});

// DELETE /recurring-payments/:id
app.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const id = c.req.param('id');

    const [existing] = await db
      .select({ id: recurringPayments.id })
      .from(recurringPayments)
      .where(and(eq(recurringPayments.id, id), eq(recurringPayments.userId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Recurring payment not found' }, 404);
    }

    await db.delete(recurringPayments).where(eq(recurringPayments.id, id));

    return c.json({ data: { success: true } });
  } catch (error) {
    console.error('Delete recurring payment error:', error);
    return c.json({ error: 'Failed to delete recurring payment' }, 500);
  }
});

// POST /recurring-payments/:id/execute - выполнить платёж
app.post('/:id/execute', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const id = c.req.param('id');

    const [payment] = await db
      .select()
      .from(recurringPayments)
      .where(and(eq(recurringPayments.id, id), eq(recurringPayments.userId, userId)))
      .limit(1);

    if (!payment) {
      return c.json({ error: 'Recurring payment not found' }, 404);
    }

    // Получаем счёт
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, payment.accountId))
      .limit(1);

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Создаём транзакцию
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        accountId: payment.accountId,
        type: payment.type,
        amount: payment.amount,
        currency: account.currency,
        description: payment.description,
        date: payment.nextDate,
      })
      .returning();

    // Обновляем баланс
    const amountNum = parseFloat(payment.amount);
    if (payment.type === 'income') {
      await db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${amountNum}` })
        .where(eq(accounts.id, payment.accountId));
    } else if (payment.type === 'expense') {
      await db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${amountNum}` })
        .where(eq(accounts.id, payment.accountId));
    }

    // Копируем теги на транзакцию
    const paymentTagLinks = await db
      .select({ tagId: recurringPaymentTags.tagId })
      .from(recurringPaymentTags)
      .where(eq(recurringPaymentTags.recurringPaymentId, id));

    if (paymentTagLinks.length > 0) {
      const { transactionTags } = await import('../db');
      await db.insert(transactionTags).values(
        paymentTagLinks.map((link) => ({
          transactionId: transaction.id,
          tagId: link.tagId,
        }))
      );
    }

    // Вычисляем следующую дату
    const currentDate = new Date(payment.nextDate);
    let nextDate: Date;

    switch (payment.frequency) {
      case 'daily':
        nextDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
        break;
      case 'weekly':
        nextDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
        break;
      case 'monthly':
        nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
        break;
      case 'yearly':
        nextDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
        break;
      default:
        nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    }

    // Обновляем следующую дату
    await db
      .update(recurringPayments)
      .set({ nextDate: nextDate.toISOString().split('T')[0] })
      .where(eq(recurringPayments.id, id));

    return c.json({
      data: {
        transaction,
        nextDate: nextDate.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Execute recurring payment error:', error);
    return c.json({ error: 'Failed to execute recurring payment' }, 500);
  }
});

export default app;

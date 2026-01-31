import { Hono } from 'hono';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import {
  db,
  balanceSnapshots,
  transactions,
  transactionTags,
  accounts,
  tags,
} from '../db';

type Variables = { userId: string };

const app = new Hono<{ Variables: Variables }>();

// GET /analytics/balance-history - история баланса
app.get('/balance-history', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { account_id, from, to } = c.req.query();

    // Получаем счета пользователя
    const userAccounts = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.userId, userId));

    const accountIds = userAccounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return c.json({ data: [] });
    }

    const conditions = [sql`${balanceSnapshots.accountId} IN ${accountIds}`];

    if (account_id) {
      conditions.push(eq(balanceSnapshots.accountId, account_id));
    }
    if (from) {
      conditions.push(gte(balanceSnapshots.date, from));
    }
    if (to) {
      conditions.push(lte(balanceSnapshots.date, to));
    }

    const result = await db
      .select({
        id: balanceSnapshots.id,
        accountId: balanceSnapshots.accountId,
        date: balanceSnapshots.date,
        balance: balanceSnapshots.balance,
        accountName: accounts.name,
        accountCurrency: accounts.currency,
      })
      .from(balanceSnapshots)
      .innerJoin(accounts, eq(balanceSnapshots.accountId, accounts.id))
      .where(and(...conditions))
      .orderBy(balanceSnapshots.date);

    return c.json({ data: result });
  } catch (error) {
    console.error('Get balance history error:', error);
    return c.json({ error: 'Failed to get balance history' }, 500);
  }
});

// GET /analytics/summary - итоги по тегам за период
app.get('/summary', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { from, to, type } = c.req.query();

    const conditions = [eq(transactions.userId, userId)];

    if (from) {
      conditions.push(gte(transactions.date, from));
    }
    if (to) {
      conditions.push(lte(transactions.date, to));
    }
    if (type) {
      conditions.push(eq(transactions.type, type));
    }

    // Получаем все транзакции за период
    const txs = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
      })
      .from(transactions)
      .where(and(...conditions));

    const transactionIds = txs.map((t) => t.id);

    // Общие суммы по типам
    const totals = {
      income: 0,
      expense: 0,
      transfer: 0,
    };

    txs.forEach((t) => {
      const amount = parseFloat(t.amount);
      if (t.type === 'income') totals.income += amount;
      else if (t.type === 'expense') totals.expense += amount;
      else if (t.type === 'transfer') totals.transfer += amount;
    });

    // Суммы по тегам
    let tagSummary: Array<{
      tagId: string;
      tagName: string;
      tagColor: string;
      tagIcon: string;
      income: number;
      expense: number;
      total: number;
    }> = [];

    if (transactionIds.length > 0) {
      const tagLinks = await db
        .select({
          transactionId: transactionTags.transactionId,
          tagId: tags.id,
          tagName: tags.name,
          tagColor: tags.color,
          tagIcon: tags.icon,
        })
        .from(transactionTags)
        .innerJoin(tags, eq(transactionTags.tagId, tags.id))
        .where(sql`${transactionTags.transactionId} IN ${transactionIds}`);

      // Группируем по тегам
      const tagMap = new Map<
        string,
        {
          tagId: string;
          tagName: string;
          tagColor: string;
          tagIcon: string;
          income: number;
          expense: number;
        }
      >();

      tagLinks.forEach((link) => {
        const tx = txs.find((t) => t.id === link.transactionId);
        if (!tx) return;

        const amount = parseFloat(tx.amount);

        if (!tagMap.has(link.tagId)) {
          tagMap.set(link.tagId, {
            tagId: link.tagId,
            tagName: link.tagName,
            tagColor: link.tagColor,
            tagIcon: link.tagIcon,
            income: 0,
            expense: 0,
          });
        }

        const tag = tagMap.get(link.tagId)!;
        if (tx.type === 'income') {
          tag.income += amount;
        } else if (tx.type === 'expense') {
          tag.expense += amount;
        }
      });

      tagSummary = Array.from(tagMap.values())
        .map((t) => ({
          ...t,
          total: t.income - t.expense,
        }))
        .sort((a, b) => b.expense - a.expense);
    }

    return c.json({
      data: {
        totals,
        balance: totals.income - totals.expense,
        byTag: tagSummary,
        transactionCount: txs.length,
      },
    });
  } catch (error) {
    console.error('Get summary error:', error);
    return c.json({ error: 'Failed to get summary' }, 500);
  }
});

// GET /analytics/trends - тренды доходов/расходов по месяцам
app.get('/trends', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { months = '12' } = c.req.query();

    const monthsNum = parseInt(months);

    // Получаем транзакции за последние N месяцев
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - monthsNum);
    const fromStr = fromDate.toISOString().split('T')[0];

    const txs = await db
      .select({
        type: transactions.type,
        amount: transactions.amount,
        date: transactions.date,
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), gte(transactions.date, fromStr)))
      .orderBy(transactions.date);

    // Группируем по месяцам
    const monthlyData = new Map<
      string,
      { month: string; income: number; expense: number }
    >();

    txs.forEach((tx) => {
      const month = tx.date.substring(0, 7); // YYYY-MM
      const amount = parseFloat(tx.amount);

      if (!monthlyData.has(month)) {
        monthlyData.set(month, { month, income: 0, expense: 0 });
      }

      const data = monthlyData.get(month)!;
      if (tx.type === 'income') {
        data.income += amount;
      } else if (tx.type === 'expense') {
        data.expense += amount;
      }
    });

    const trends = Array.from(monthlyData.values())
      .map((m) => ({
        ...m,
        balance: m.income - m.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return c.json({ data: trends });
  } catch (error) {
    console.error('Get trends error:', error);
    return c.json({ error: 'Failed to get trends' }, 500);
  }
});

// POST /analytics/snapshot - создать снапшот баланса (для cron)
app.post('/snapshot', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const today = new Date().toISOString().split('T')[0];

    // Получаем все счета пользователя
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));

    const snapshots: Array<typeof balanceSnapshots.$inferSelect> = [];

    for (const account of userAccounts) {
      // Upsert: обновляем или создаём снапшот на сегодня
      const [existing] = await db
        .select({ id: balanceSnapshots.id })
        .from(balanceSnapshots)
        .where(
          and(
            eq(balanceSnapshots.accountId, account.id),
            eq(balanceSnapshots.date, today)
          )
        )
        .limit(1);

      if (existing) {
        const [snapshot] = await db
          .update(balanceSnapshots)
          .set({ balance: account.balance })
          .where(eq(balanceSnapshots.id, existing.id))
          .returning();
        snapshots.push(snapshot);
      } else {
        const [snapshot] = await db
          .insert(balanceSnapshots)
          .values({
            accountId: account.id,
            date: today,
            balance: account.balance,
          })
          .returning();
        snapshots.push(snapshot);
      }
    }

    return c.json({ data: snapshots });
  } catch (error) {
    console.error('Create snapshot error:', error);
    return c.json({ error: 'Failed to create snapshot' }, 500);
  }
});

export default app;

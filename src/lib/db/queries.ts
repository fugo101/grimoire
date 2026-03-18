import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";
import { eq, and, like, desc, sql } from "drizzle-orm";

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export async function getTransactions(filters?: {
  month?: string;
  categoryId?: string;
}) {
  const conditions = [];

  if (filters?.categoryId) {
    conditions.push(eq(transactions.categoryId, filters.categoryId));
  }

  if (filters?.month) {
    conditions.push(like(transactions.date, `${filters.month}%`));
  }

  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      note: transactions.note,
      date: transactions.date,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date), desc(transactions.createdAt));

  return rows;
}

export async function getCategoryByShareToken(token: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(eq(categories.shareToken, token), eq(categories.isPublic, true))
    );

  return category ?? null;
}

export async function getTransactionsByCategoryId(categoryId: string) {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.categoryId, categoryId))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
}

export async function getCategoryTotal(categoryId: string): Promise<number> {
  const [result] = await db
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(eq(transactions.categoryId, categoryId));

  return result?.total ?? 0;
}

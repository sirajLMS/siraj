import { eq, inArray } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import type { ParentProfileResult } from "@/backend/db/repo/parents/parent.repository.helpers";
import { parents, users } from "@/backend/db/schema";
import type { DBTransaction, ParentSelectType } from "@/backend/types";
import { parseAccountStatus, parseCurrencyCode, parseIanaTimezone } from "@/shared/lib/enum";

export const getParentProfileImpl = async (
  parentId: string,
  tx?: DBTransaction
): Promise<ParentProfileResult | null> => {
  const executor = tx ?? db;

  const results = await executor
    .select({
      id: parents.id,
      userId: parents.userId,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      lifecycleStatus: parents.status,
      accountStatus: users.status,
      phone: users.phone,
      nationality: parents.nationality,
      address: parents.address,
      facebook: parents.facebook,
      whatsapp: parents.whatsapp,
      twitter: parents.twitter,
      invoiceType: parents.invoiceType,
      feeAmount: parents.feeAmount,
      currency: parents.currency,
      displayCurrency: users.displayCurrency,
      timezone: users.timezone,
      createdAt: parents.createdAt,
      updatedAt: parents.updatedAt,
    })
    .from(parents)
    .innerJoin(users, eq(parents.userId, users.id))
    .where(eq(parents.id, parentId))
    .limit(1);

  if (!results[0]) return null;

  return {
    ...results[0],
    accountStatus: parseAccountStatus(results[0].accountStatus),
    timezone: parseIanaTimezone(results[0].timezone),
    displayCurrency: parseCurrencyCode(results[0].displayCurrency),
  };
};

export const findByUserIdImpl = async (userId: string, tx?: DBTransaction): Promise<ParentSelectType | null> => {
  const q = queryDb(tx);
  const [parent] = await q.select().from(parents).where(eq(parents.userId, userId)).limit(1);
  return parent ?? null;
};

export const listByUserIdsImpl = async (userIds: string[], tx?: DBTransaction): Promise<ParentSelectType[]> => {
  if (userIds.length === 0) return [];
  const q = queryDb(tx);
  return q.select().from(parents).where(inArray(parents.userId, userIds));
};

export const findUserIdByParentIdImpl = async (parentId: string, tx?: DBTransaction): Promise<string | null> => {
  const q = queryDb(tx);
  const [parent] = await q.select({ userId: parents.userId }).from(parents).where(eq(parents.id, parentId)).limit(1);
  return parent?.userId ?? null;
};

export const findByUserIdsImpl = async (userIds: string[], tx?: DBTransaction): Promise<Map<string, string | null>> => {
  if (userIds.length === 0) return new Map();

  const q = queryDb(tx);
  const rows = await q
    .select({ userId: parents.userId, parentId: parents.id })
    .from(parents)
    .where(inArray(parents.userId, userIds));

  const map = new Map<string, string | null>(userIds.map(id => [id, null]));
  for (const row of rows) {
    map.set(row.userId, row.parentId);
  }
  return map;
};

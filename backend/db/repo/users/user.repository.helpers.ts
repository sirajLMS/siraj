import { eq, type SQL } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { users } from "@/backend/db/schema";
import type { DBTransaction, UserInsertType, UserSelectType } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { getServerTranslations } from "@/shared/locale";

const SAFE_USER_SELECT = {
  id: users.id,
  name: users.name,
  email: users.email,
  emailVerifiedAt: users.emailVerifiedAt,
  password: users.password,
  rememberTokenHash: users.rememberTokenHash,
  avatarFilePath: users.avatarFilePath,
  avatarUrl: users.avatarUrl,
  phone: users.phone,
  status: users.status,
  isSuperAdmin: users.isSuperAdmin,
  timezone: users.timezone,
  displayCurrency: users.displayCurrency,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  deletedAt: users.deletedAt,
} as const;

export async function selectSafeUserRows(where: SQL, tx?: DBTransaction, limit?: number): Promise<UserSelectType[]> {
  const q = queryDb(tx);
  const base = q.select(SAFE_USER_SELECT).from(users).where(where);
  return limit === undefined ? base : base.limit(limit);
}

export type UserProfileUpdateInput = {
  readonly name?: string;
  readonly email?: string;
  readonly avatarUrl?: string | null;
  readonly avatarFilePath?: string | null;
  readonly displayCurrency?: CurrencyCode | null;
  readonly phone?: string | null;
};

export type BootstrapUserUpsertInput = {
  name: string;
  email: string;
  hashedPassword: string;
  isSuperAdmin?: boolean;
};

export async function updateUserColumn(
  userId: string,
  set: Partial<UserInsertType>,
  tx?: DBTransaction,
  locale?: string
): Promise<UserSelectType> {
  const executor = tx ?? db;
  const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

  const [updated] = await executor
    .update(users)
    .set({ ...set, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new Error(errorsTranslations.userNotFound(userId));
  }

  return updated;
}

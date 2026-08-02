import bcrypt from "bcryptjs";
import { and, asc, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { SoftDeleteRepository } from "@/backend/db/repo/shared/soft-delete.repository";
import { users } from "@/backend/db/schema";
import type { AccountStatus, CurrencyCode } from "@/backend/enum";
import {
  isValidIanaTimezone,
  logger,
  normalizeIanaTimezone,
  parseAccountStatus,
  validatePasswordStrength,
} from "@/backend/lib";
import {
  type PaginatedUsersResponseSelectType,
  PaginationArgsDefault,
  type PaginationInput,
  type UserCreateInput,
  type UserReturnType,
  type UserSelectType,
} from "@/backend/types";
import { AuthUtils } from "@/backend/utils";
import { getServerTranslations } from "@/shared/locale";

// ============================================================================
// Prepared Statements (Drizzle Prepared Statements 2.0)
// ============================================================================

const usersTotalCountPrepared = db.select({ total: count() }).from(users).prepare("users_total_count");

export async function findOne(condition: SQL | undefined): Promise<UserSelectType | null> {
  try {
    const results = await db.select().from(users).where(condition).limit(1);
    return results[0] ?? null;
  } catch (error) {
    logger.error("Error finding one user:", error);
    return null;
  }
}

export namespace UserRepository {
  export const existsByEmail = async (email: string, tx?: DBTransaction): Promise<boolean> => {
    const q = queryDb(tx);
    const [result] = await q.select({ count: count() }).from(users).where(eq(users.email, email));
    return Number(result?.count ?? 0) > 0;
  };

  export const findUserByIdOrThrow = async (id: string, locale?: string): Promise<UserSelectType> => {
    const user = await findById(id);
    if (!user) {
      throw new Error(getServerTranslations(locale ?? "en").errorsTranslations.userNotFound(id));
    }
    return user;
  };

  export const findById = async (id: string): Promise<UserSelectType | null> => {
    const q = queryDb();
    const result = await q.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ?? null;
  };

  export const findByPhone = async (phone: string, tx?: DBTransaction): Promise<UserSelectType | null> => {
    const q = queryDb(tx);
    // Order by createdAt for deterministic first-match when multiple users share a phone.
    const result = await q.select().from(users).where(eq(users.phone, phone)).orderBy(asc(users.createdAt)).limit(1);
    return result[0] ?? null;
  };

  /**
   * Batch-fetch contact info (email/phone) for multiple users in a single
   * query. Returns a `Map<userId, UserSelectType | null>` — pre-initialized
   * with all requested keys mapped to `null`, then filled from query results.
   * Users not found (or soft-deleted / RLS-excluded) remain `null`.
   */
  export const findSafeByIds = async (
    ids: string[],
    tx?: DBTransaction
  ): Promise<Map<string, UserSelectType | null>> => {
    const map = new Map<string, UserSelectType | null>();
    if (ids.length === 0) {
      return map;
    }
    for (const id of ids) {
      map.set(id, null);
    }
    try {
      const q = queryDb(tx);
      const results = await q
        .select({
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
        })
        .from(users)
        .where(inArray(users.id, ids));

      for (const row of results) {
        map.set(row.id, row);
      }
    } catch (error) {
      logger.error("Error finding safe users by ids:", error);
    }
    return map;
  };

  export const findSafeById = async (id: string, tx?: DBTransaction): Promise<UserSelectType | null> => {
    const q = queryDb(tx);
    try {
      const results = await q
        .select({
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
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return results[0] ?? null;
    } catch (error) {
      logger.error("Error finding safe user by id:", error);
      return null;
    }
  };

  export const findDisplayCurrenciesByIds = async (ids: string[]): Promise<Map<string, CurrencyCode | null>> => {
    if (ids.length === 0) {
      return new Map();
    }

    const q = queryDb();
    const results = await q
      .select({ id: users.id, displayCurrency: users.displayCurrency })
      .from(users)
      .where(inArray(users.id, ids));

    const map = new Map<string, CurrencyCode | null>();
    for (const row of results) {
      map.set(row.id, row.displayCurrency ?? null);
    }
    return map;
  };

  export const findByEmail = async (email: string): Promise<UserSelectType | null> => {
    const q = queryDb();
    const result = await q.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] ?? null;
  };

  export const usersTotalCount = async (): Promise<number> => {
    const [result] = await usersTotalCountPrepared.execute();
    return result.total;
  };

  /**
   * @deprecated Use `findUsersPaginated` instead. This method lacks pagination and returns all rows.
   */
  export const findAll = async (): Promise<
    Pick<UserReturnType, "id" | "name" | "email" | "status" | "createdAt">[]
  > => {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .limit(500);
    return rows.map(row => ({
      ...row,
      status: parseAccountStatus(row.status),
    }));
  };

  export const findUsers = async (opts: {
    limit: number;
    offset: number;
    search?: string | null;
  }): Promise<UserReturnType[]> => {
    const conditions: (SQL | undefined)[] = [];
    const trimmedSearch = opts.search?.trim();
    if (trimmedSearch) {
      conditions.push(or(ilike(users.name, `%${trimmedSearch}%`), ilike(users.email, `%${trimmedSearch}%`)));
    }

    // Build the conditions dynamically for prepared statement
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(users.createdAt)
      .limit(opts.limit)
      .offset(opts.offset);
    return results.map(user => AuthUtils.toUserReturnType(user));
  };

  export const loadByIds = async (ids: string[], locale?: string): Promise<(UserReturnType | Error)[]> => {
    if (ids.length === 0) return [];
    const filteredUsers = await db.select().from(users).where(inArray(users.id, ids));
    const { userNotFound } = getServerTranslations(locale ?? "en").errorsTranslations;

    return ids.map(id => {
      const matchingUser = filteredUsers.find(c => c.id === id);
      if (!matchingUser) return new Error(userNotFound(id));
      return AuthUtils.toUserReturnType(matchingUser);
    });
  };

  export const findUsersPaginated = async (
    paginationArgs?: PaginationInput | null
  ): Promise<PaginatedUsersResponseSelectType> => {
    const { first, skip, page, maxCount } = paginationArgs ?? {};

    const total = await usersTotalCount();

    const perPage = Math.min(first ?? PaginationArgsDefault.first, maxCount ?? PaginationArgsDefault.maxCount);
    const currentPage = page ?? (skip ? Math.floor(skip / perPage) + 1 : 1);
    const offset = (currentPage - 1) * perPage;

    // Build the conditions (empty for now since we don't support search in paginated yet)
    const whereClause = undefined;

    const usersList = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(users.createdAt)
      .limit(perPage)
      .offset(offset);

    const length = usersList.length;
    const lastPage = Math.ceil(total / perPage);

    return {
      data: usersList.map(user => AuthUtils.toUserReturnType(user)),
      pageInfo: {
        count: length,
        currentPage,
        firstItem: length > 0 ? offset + 1 : null,
        lastItem: length > 0 ? offset + length : null,
        hasMorePages: currentPage < lastPage,
        lastPage,
        perPage,
        total,
      },
    };
  };

  export const create = async (
    input: UserCreateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<UserReturnType> => {
    const queryDb = tx ?? db;
    const exists = await existsByEmail(input.email.value, tx);
    const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
    if (exists) {
      throw new Error(errorsTranslations.userEmailExists);
    }

    AuthUtils.validateUserName(input.name);
    await validatePasswordStrength(input.password, locale);
    const now = new Date();
    const hashedPassword = await bcrypt.hash(input.password, 12);

    try {
      const [result] = await queryDb
        .insert(users)
        .values({
          name: input.name,
          email: input.email.value,
          password: hashedPassword,
          emailVerifiedAt: now,
          createdAt: now,
          updatedAt: now,
          ...(input.avatarUrl === undefined ? {} : { avatarUrl: input.avatarUrl }),
        })
        .returning();
      return AuthUtils.toUserReturnType(result);
    } catch (err) {
      logger.error(err);
      throw new Error(`Failed to create user with email: ${input.email.value}`, { cause: err });
    }
  };

  export const deleteUserById = async (id: string, actorUserId?: string | null): Promise<UserReturnType> => {
    const { entity } = await SoftDeleteRepository.softDeleteUser(id, actorUserId);
    return AuthUtils.toUserReturnType(entity);
  };

  export type UserProfileUpdateInput = {
    readonly name?: string;
    readonly email?: string;
    readonly avatarUrl?: string | null;
    readonly displayCurrency?: CurrencyCode | null;
    readonly phone?: string | null;
  };

  export const updateProfileFields = async (
    userId: string,
    input: UserProfileUpdateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<UserReturnType> => {
    const queryDb = tx ?? db;
    const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

    const existing = await findSafeById(userId, tx);
    if (!existing) {
      throw new Error(errorsTranslations.userNotFound(userId));
    }

    const updateSet: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      AuthUtils.validateUserName(input.name);
      updateSet.name = input.name;
    }

    if (input.email !== undefined) {
      const emailExists = await existsByEmail(input.email, tx);
      if (emailExists && existing.email !== input.email) {
        throw new Error(errorsTranslations.userEmailExists);
      }
      updateSet.email = input.email;
    }

    if (input.avatarUrl !== undefined) {
      updateSet.avatarUrl = input.avatarUrl;
    }

    if (input.displayCurrency !== undefined) {
      updateSet.displayCurrency = input.displayCurrency;
    }

    if (input.phone !== undefined) {
      updateSet.phone = input.phone;
    }

    const [updated] = await queryDb.update(users).set(updateSet).where(eq(users.id, userId)).returning();

    if (!updated) {
      throw new Error(errorsTranslations.userNotFound(userId));
    }

    return AuthUtils.toUserReturnType(updated);
  };

  async function updateUserColumn(
    userId: string,
    set: Partial<typeof users.$inferInsert>,
    tx?: DBTransaction,
    locale?: string
  ): Promise<UserSelectType> {
    const queryDb = tx ?? db;
    const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

    const [updated] = await queryDb
      .update(users)
      .set({ ...set, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      throw new Error(errorsTranslations.userNotFound(userId));
    }

    return updated;
  }

  export const updatePassword = async (
    userId: string,
    hashedPassword: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<UserSelectType> => {
    return updateUserColumn(userId, { password: hashedPassword }, tx, locale);
  };

  export const updateTimezone = async (
    userId: string,
    timezone: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<UserSelectType> => {
    const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
    const normalizedTimezone = normalizeIanaTimezone(timezone);

    if (!isValidIanaTimezone(normalizedTimezone)) {
      throw new Error(errorsTranslations.parent.invalidTimezone);
    }

    return updateUserColumn(userId, { timezone: normalizedTimezone }, tx, locale);
  };

  export const updateDisplayCurrency = async (
    userId: string,
    displayCurrency: CurrencyCode,
    tx?: DBTransaction,
    locale?: string
  ): Promise<UserSelectType> => {
    return updateUserColumn(userId, { displayCurrency }, tx, locale);
  };

  export const updateStatus = async (
    userId: string,
    status: AccountStatus,
    tx?: DBTransaction,
    locale?: string
  ): Promise<UserSelectType> => {
    return updateUserColumn(userId, { status }, tx, locale);
  };

  export type BootstrapUserUpsertInput = {
    name: string;
    email: string;
    hashedPassword: string;
    isSuperAdmin?: boolean;
  };

  export const upsertBootstrapUser = async (
    input: BootstrapUserUpsertInput,
    tx?: DBTransaction
  ): Promise<UserSelectType> => {
    const queryDb = tx ?? db;
    const now = new Date();
    const [user] = await queryDb
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        password: input.hashedPassword,
        isSuperAdmin: input.isSuperAdmin ?? false,
        displayCurrency: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: input.name,
          isSuperAdmin: input.isSuperAdmin ?? false,
          updatedAt: now,
        },
      })
      .returning();
    return user;
  };
}

import bcrypt from "bcryptjs";
import { and, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
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
    const queryDb = tx ?? db;
    return (await queryDb.$count(users, eq(users.email, email))) > 0;
  };

  export const findUserByIdOrThrow = async (id: string, locale?: string): Promise<UserSelectType> => {
    const user = await findById(id);
    if (!user) {
      throw new Error(getServerTranslations(locale ?? "en").errorsTranslations.userNotFound(id));
    }
    return user;
  };

  export const findById = async (id: string): Promise<UserSelectType | null> => {
    return findOne(eq(users.id, id));
  };

  export const findSafeById = async (id: string, tx?: DBTransaction): Promise<UserSelectType | null> => {
    const queryDb = tx ?? db;
    try {
      const results = await queryDb
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

    const results = await db
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
    return findOne(eq(users.email, email));
  };

  export const usersTotalCount = async (): Promise<number> => {
    const [result] = await db.select({ total: count() }).from(users);
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

    const results = await db
      .select()
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
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

    const usersList = await findUsers({
      limit: perPage,
      offset,
    });

    const length = usersList.length;
    const lastPage = Math.ceil(total / perPage);

    return {
      data: usersList,
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

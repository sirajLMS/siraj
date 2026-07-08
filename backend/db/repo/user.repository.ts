import bcrypt from "bcryptjs";
import { count, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SoftDeleteRepository } from "@/backend/db/repo/soft-delete.repository";
import { users } from "@/backend/db/schema";
import { PaginationArgsDefault } from "@/backend/graphql/pothos/pagination.objects";
import { validatePasswordStrength } from "@/backend/lib/auth/password";
import { getBackendTranslations } from "@/backend/lib/intl";
import logger from "@/backend/lib/logger";
import type { PaginatedUsersResponseSelectType } from "@/backend/types/auth.types";
import type { PaginationInput } from "@/backend/types/pagination.types";
import type { UserCreateInput, UserReturnType, UserSelectType } from "@/backend/types/user.types";
import { AuthUtils } from "@/backend/utils";
import type { DBTransaction } from "../db.types";

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
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("userNotFound", { id }));
    }
    return user;
  };

  export const findById = async (id: string): Promise<UserSelectType | null> => {
    return findOne(eq(users.id, id));
  };

  export const findSafeById = async (id: string): Promise<UserSelectType | null> => {
    try {
      const results = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerifiedAt: users.emailVerifiedAt,
          password: users.password,
          rememberTokenHash: users.rememberTokenHash,
          avatarFilePath: users.avatarFilePath,
          avatarUrl: users.avatarUrl,
          isActive: users.isActive,
          isSuperAdmin: users.isSuperAdmin,
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
    Pick<UserReturnType, "id" | "name" | "email" | "isActive" | "createdAt">[]
  > => {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .limit(500);
  };

  export const findUsers = async (opts: { limit: number; offset: number }): Promise<UserReturnType[]> => {
    const results = await db.select().from(users).orderBy(users.createdAt).limit(opts.limit).offset(opts.offset);
    return results.map(user => AuthUtils.toUserReturnType(user));
  };

  export const loadByIds = async (ids: string[], locale?: string): Promise<(UserReturnType | Error)[]> => {
    if (ids.length === 0) return [];
    const filteredUsers = await db.select().from(users).where(inArray(users.id, ids));
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    return ids.map(id => {
      const matchingUser = filteredUsers.find(c => c.id === id);
      if (!matchingUser) return new Error(t("userNotFound", { id }));
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
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    if (exists) {
      throw new Error(t("userEmailExists", { email: input.email.value }));
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
        })
        .returning();
      return AuthUtils.toUserReturnType(result);
    } catch (err) {
      logger.error(err);
      throw new Error(t("userCreateFailed", { email: input.email.value }), { cause: err });
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
  };

  export const updateProfileFields = async (
    userId: string,
    input: UserProfileUpdateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<UserReturnType> => {
    const queryDb = tx ?? db;
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    const existing = await findSafeById(userId);
    if (!existing) {
      throw new Error(t("userNotFound", { id: userId }));
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
        throw new Error(t("userEmailExists", { email: input.email }));
      }
      updateSet.email = input.email;
    }

    if (input.avatarUrl !== undefined) {
      updateSet.avatarUrl = input.avatarUrl;
    }

    const [updated] = await queryDb.update(users).set(updateSet).where(eq(users.id, userId)).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
      password: users.password,
      rememberTokenHash: users.rememberTokenHash,
      avatarFilePath: users.avatarFilePath,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      isSuperAdmin: users.isSuperAdmin,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      deletedAt: users.deletedAt,
    });

    if (!updated) {
      throw new Error(t("userNotFound", { id: userId }));
    }

    return AuthUtils.toUserReturnType(updated);
  };
}

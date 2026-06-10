import bcrypt from "bcryptjs";
import { count, eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SoftDeleteRepository } from "@/backend/db/repo/soft-delete.repository";
import { users } from "@/backend/db/schema";
import { PaginationArgsDefault } from "@/backend/graphql/pothos";
import logger from "@/backend/lib/logger";
import type { PaginatedUsersResponseSelectType, PaginationArgs, UserCreateInput, UserEntity } from "@/backend/types";
import { AuthUtils } from "@/backend/utils";

export namespace UserRepository {
  export const existsByEmail = async (email: string): Promise<boolean> => {
    return (await db.$count(users, eq(users.email, email))) > 0;
  };

  export const findUserByIdOrThrow = async (id: string): Promise<UserEntity> => {
    try {
      return await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .then(res => {
          const t = res[0];
          return t;
        });
    } catch (e) {
      logger.error("findUserByIdOrThrow error:", e);
      throw e;
    }
  };

  export const findById = async (id: string): Promise<UserEntity | null | undefined> => {
    try {
      return await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .then(res => {
          return res[0];
        });
    } catch {
      return null;
    }
  };

  export const findByEmail = async (email: string): Promise<UserEntity | null | undefined> => {
    try {
      return await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .then(res => {
          return res[0];
        });
    } catch {
      return null;
    }
  };

  export const usersTotalCount = async (): Promise<number> => {
    const [result] = await db.select({ total: count() }).from(users);
    return result.total;
  };

  export const findAll = async (): Promise<UserEntity[]> => {
    return await db.select().from(users);
  };

  export const findUsers = async (opts: { limit: number; offset: number }): Promise<UserEntity[]> => {
    return await db.select().from(users).orderBy().limit(opts.limit).offset(opts.offset);
  };

  export const loadByIds = async (ids: string[]): Promise<(UserEntity | Error)[]> => {
    if (ids.length === 0) return [];
    const filteredUsers = await db.select().from(users).where(inArray(users.id, ids));

    const userList: (UserEntity | Error)[] = ids.map(id => {
      const matchingUser = filteredUsers.find(c => c.id === id);
      if (!matchingUser) return new Error(`User ${id} not found`);
      return matchingUser;
    });
    return userList;
  };

  export const findUsersPaginated = async (
    paginationArgs?: PaginationArgs | null
  ): Promise<PaginatedUsersResponseSelectType> => {
    const { first, skip, page, maxCount } = paginationArgs ?? {};

    const total = await usersTotalCount();

    // Figure out pagination
    const perPage = Math.min(first ?? PaginationArgsDefault.first, maxCount ?? PaginationArgsDefault.maxCount);
    const currentPage = page ?? (skip ? Math.floor(skip / perPage) + 1 : 1);
    const offset = (currentPage - 1) * perPage;

    const users = await findUsers({
      limit: perPage,
      offset,
    });

    const length = users.length;
    const lastPage = Math.ceil(total / perPage);
    const hasMorePages = currentPage < lastPage;

    const result: PaginatedUsersResponseSelectType = {
      data: users,
      pageInfo: {
        count: length,
        currentPage,
        firstItem: length > 0 ? offset + 1 : null,
        lastItem: length > 0 ? offset + length : null,
        hasMorePages,
        lastPage,
        perPage,
        total,
      },
    };

    return result;
  };

  export const create = async (input: UserCreateInput): Promise<UserEntity> => {
    await existsByEmail(input.email.value).then(exists => {
      if (exists) {
        throw new Error(`User with email ${input.email.value} already exists`);
      }
    });

    AuthUtils.validateUserName(input.name);
    const now = new Date();
    const hashedPassword = await bcrypt.hash(input.password, 12);

    try {
      const [result] = await db
        .insert(users)
        .values({
          name: input.name,
          email: input.email.value,
          password: hashedPassword,
          emailVerifiedAt: now,
          rememberTokenHash: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return result;
    } catch (err) {
      logger.error(err);
      throw new Error(`Failed to create user with email: ${input.email.value}`, { cause: err });
    }
  };

  export const deleteUserById = async (id: string, actorUserId?: string | null): Promise<UserEntity> => {
    const { entity } = await SoftDeleteRepository.softDeleteUser(id, actorUserId);
    return entity;
  };
}

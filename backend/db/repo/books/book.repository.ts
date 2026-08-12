import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/types";
import { db } from "@/backend/db/drizzleDb";
import { SoftDeleteRepository } from "@/backend/db/repo/shared/soft-delete.repository";
import { books } from "@/backend/db/schema";
import { AvailabilityStatus } from "@/backend/enum";
import type { PaginationArgs } from "@/backend/types";
import type { BookReturnType } from "@/backend/types/books/book.types";

const VALID_AVAILABILITY_STATUSES = new Set(Object.values(AvailabilityStatus) as readonly string[]);

function isAvailabilityStatus(value: string): value is AvailabilityStatus {
  return VALID_AVAILABILITY_STATUSES.has(value);
}

function mapRow(row: { id: string; name: string; availabilityStatus: string; createdAt: Date }): BookReturnType {
  return {
    id: row.id,
    name: row.name,
    availabilityStatus: isAvailabilityStatus(row.availabilityStatus)
      ? row.availabilityStatus
      : AvailabilityStatus.AVAILABLE,
    createdAt: row.createdAt,
  };
}

export namespace BookRepository {
  export async function findMany(pagination?: PaginationArgs | null, tx?: DBTransaction): Promise<BookReturnType[]> {
    const q = queryDb(tx);

    const baseQuery = q
      .select({
        id: books.id,
        name: books.name,
        availabilityStatus: books.availabilityStatus,
        createdAt: books.createdAt,
      })
      .from(books)
      .where(isNull(books.deletedAt))
      .orderBy(desc(books.createdAt));

    if (pagination) {
      const rows = await baseQuery.limit(pagination.perPage).offset(pagination.offset);
      return rows.map(mapRow);
    }

    const rows = await baseQuery.limit(200);
    return rows.map(mapRow);
  }

  export async function findById(bookId: string, tx?: DBTransaction): Promise<BookReturnType | null> {
    const q = queryDb(tx);
    const results = await q
      .select({
        id: books.id,
        name: books.name,
        availabilityStatus: books.availabilityStatus,
        createdAt: books.createdAt,
      })
      .from(books)
      .where(and(eq(books.id, bookId), isNull(books.deletedAt)))
      .limit(1);

    return results[0] ? mapRow(results[0]) : null;
  }

  export async function deleteBook(id: string, actorUserId?: string | null, tx?: DBTransaction): Promise<boolean> {
    await SoftDeleteRepository.softDelete({ tableName: "books", entityId: id, actorUserId }, tx);
    return true;
  }

  export async function findByNames(names: readonly string[], tx?: DBTransaction): Promise<BookReturnType[]> {
    if (names.length === 0) return [];
    const q = queryDb(tx);
    const rows = await q
      .select({
        id: books.id,
        name: books.name,
        availabilityStatus: books.availabilityStatus,
        createdAt: books.createdAt,
      })
      .from(books)
      .where(and(inArray(books.name, [...names]), isNull(books.deletedAt)));
    return rows.map(mapRow);
  }

  export async function upsertMany(
    inputs: readonly { name: string; availabilityStatus: AvailabilityStatus }[],
    tx?: DBTransaction
  ): Promise<BookReturnType[]> {
    if (inputs.length === 0) return [];

    const run = async (t: DBTransaction): Promise<BookReturnType[]> => {
      const now = new Date();

      const results = await Promise.all(
        inputs.map(async input => {
          const [existing] = await t
            .select({
              id: books.id,
              name: books.name,
              availabilityStatus: books.availabilityStatus,
              createdAt: books.createdAt,
            })
            .from(books)
            .where(and(eq(books.name, input.name), isNull(books.deletedAt)))
            .limit(1);

          if (existing) {
            const [updated] = await t
              .update(books)
              .set({ availabilityStatus: input.availabilityStatus })
              .where(eq(books.id, existing.id))
              .returning({
                id: books.id,
                name: books.name,
                availabilityStatus: books.availabilityStatus,
                createdAt: books.createdAt,
              });
            return updated ? mapRow(updated) : null;
          }

          const [created] = await t
            .insert(books)
            .values({
              name: input.name,
              availabilityStatus: input.availabilityStatus,
              createdAt: now,
            })
            .returning({
              id: books.id,
              name: books.name,
              availabilityStatus: books.availabilityStatus,
              createdAt: books.createdAt,
            });

          return created ? mapRow(created) : null;
        })
      );

      return results.filter((r): r is BookReturnType => r !== null);
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }
}

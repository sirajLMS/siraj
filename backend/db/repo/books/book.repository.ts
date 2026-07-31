import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { SoftDeleteRepository } from "@/backend/db/repo/shared/soft-delete.repository";
import { books } from "@/backend/db/schema";
import type { AvailabilityStatus } from "@/backend/enum";
import type { PaginationArgs } from "@/backend/types";
import type { BookReturnType } from "@/backend/types/books/book.types";

// ============================================================================
// Prepared Statements (Drizzle Prepared Statements 2.0)
// ============================================================================
// Defined at module level to be compiled once and reused across requests.
// Prepared statements cannot be used inside transactions (tied to the session they were created with).

const findByIdPrepared = db
  .select({
    id: books.id,
    name: books.name,
    availabilityStatus: books.availabilityStatus,
    createdAt: books.createdAt,
  })
  .from(books)
  .where(and(eq(books.id, sql.placeholder("bookId")), isNull(books.deletedAt)))
  .limit(1)
  .prepare("find_book_by_id");

function mapRow(row: { id: string; name: string; availabilityStatus: string; createdAt: Date }): BookReturnType {
  return {
    id: row.id,
    name: row.name,
    availabilityStatus: row.availabilityStatus as AvailabilityStatus,
    createdAt: row.createdAt,
  };
}

export namespace BookRepository {
  export async function findMany(pagination?: PaginationArgs | null, tx?: DBTransaction): Promise<BookReturnType[]> {
    const queryDb = tx ?? db;

    const baseQuery = queryDb
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
    if (!tx) {
      const result = await findByIdPrepared.execute({ bookId });
      return result[0] ? mapRow(result[0]) : null;
    }
    const results = await tx
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
    const queryDb = tx ?? db;
    const rows = await queryDb
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
      const results: BookReturnType[] = [];
      const now = new Date();

      for (const input of inputs) {
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
          if (updated) {
            results.push(mapRow(updated));
          }
          continue;
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

        if (created) {
          results.push(mapRow(created));
        }
      }

      return results;
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }
}

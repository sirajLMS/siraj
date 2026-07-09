import { and, desc, eq, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { SoftDeleteRepository } from "@/backend/db/repo/soft-delete.repository";
import { books } from "@/backend/db/schema";
import type { AvailabilityStatus } from "@/backend/enum";
import type { PaginationArgs } from "@/backend/types";
import type { BookReturnType } from "@/backend/types/book.types";

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
    const queryDb = tx ?? db;

    const results = await queryDb
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
}

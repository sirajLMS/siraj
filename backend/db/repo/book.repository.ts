import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { books } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type { BookReturnType } from "@/backend/types/book.types";
import type { AvailabilityStatus } from "@/shared/lib/enum";
import type { DBTransaction } from "../db.types";

function mapRow(row: { id: string; name: string; availabilityStatus: string; createdAt: Date }): BookReturnType {
  return {
    id: row.id,
    name: row.name,
    availabilityStatus: row.availabilityStatus as AvailabilityStatus,
    createdAt: row.createdAt,
  };
}

export namespace BookRepository {
  export async function findMany(tx?: DBTransaction): Promise<BookReturnType[]> {
    const queryDb = tx ?? db;

    const rows = await queryDb
      .select({
        id: books.id,
        name: books.name,
        availabilityStatus: books.availabilityStatus,
        createdAt: books.createdAt,
      })
      .from(books)
      .where(isNull(books.deletedAt))
      .orderBy(desc(books.createdAt));

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

  export async function deleteBook(id: string, locale?: string, tx?: DBTransaction): Promise<boolean> {
    const execute = async (t: DBTransaction): Promise<boolean> => {
      const t18n = await getBackendTranslations({ locale, namespace: "errors" });

      const existing = await t
        .select({ id: books.id, name: books.name })
        .from(books)
        .where(and(eq(books.id, id), isNull(books.deletedAt)))
        .limit(1);

      if (existing.length === 0) {
        throw new Error(t18n("bookNotFound"));
      }

      await t.update(books).set({ deletedAt: new Date() }).where(eq(books.id, id));

      logger.info("Book deleted", { bookId: id });
      return true;
    };

    if (tx) {
      return await execute(tx);
    }
    return await db.transaction(execute);
  }
}

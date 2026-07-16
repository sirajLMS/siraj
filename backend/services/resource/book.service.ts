import { BookRepository } from "@/backend/db/repo/books/book.repository";
import { AppPermission, type AvailabilityStatus } from "@/backend/enum";
import { DomainError, UnauthorizedError } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { BookReturnType } from "@/backend/types/books/book.types";
import { getServerTranslations } from "@/shared/locale";

export namespace BookService {
  export async function listBooks(actorUserId: string, locale?: string): Promise<BookReturnType[]> {
    const t = getServerTranslations(locale ?? "ar").errorsTranslations;

    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_LIST);
    if (!hasPermission) {
      throw new UnauthorizedError(t.unauthorizedAction);
    }

    return await BookRepository.findMany();
  }

  export async function deleteBook(bookId: string, actorUserId: string, locale?: string): Promise<boolean> {
    try {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;

      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_DELETE);
      if (!hasPermission) {
        throw new UnauthorizedError(t.unauthorizedAction);
      }

      await BookRepository.deleteBook(bookId, actorUserId);

      logger.info("Book deleted", { bookId, actorUserId });
      return true;
    } catch (error) {
      if (error instanceof DomainError) {
        if (error.code === "UNAUTHORIZED" || error.code === "BOOKS_NOT_FOUND") {
          throw error;
        }
      }
      throw new Error("bookDeleteFailed", { cause: error });
    }
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function findBooksByNames(names: readonly string[]): Promise<BookReturnType[]> {
    return BookRepository.findByNames(names);
  }

  export async function upsertManyBooks(
    inputs: readonly { name: string; availabilityStatus: AvailabilityStatus }[]
  ): Promise<BookReturnType[]> {
    return BookRepository.upsertMany(inputs);
  }
}

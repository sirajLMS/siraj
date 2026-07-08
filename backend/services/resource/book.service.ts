import { BookRepository } from "@/backend/db/repo/book.repository";
import { AppPermission } from "@/backend/enum";
import { DomainError, UnauthorizedError } from "@/backend/lib";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { BookReturnType } from "@/backend/types/book.types";

export namespace BookService {
  export async function listBooks(actorUserId: string, locale?: string): Promise<BookReturnType[]> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_LIST);
    if (!hasPermission) {
      throw new UnauthorizedError(t("unauthorizedAction"));
    }

    return await BookRepository.findMany();
  }

  export async function deleteBook(bookId: string, actorUserId: string, locale?: string): Promise<boolean> {
    try {
      const t = await getBackendTranslations({ locale, namespace: "errors" });

      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_DELETE);
      if (!hasPermission) {
        throw new UnauthorizedError(t("unauthorizedAction"));
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
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("bookDeleteFailed"), { cause: error });
    }
  }
}

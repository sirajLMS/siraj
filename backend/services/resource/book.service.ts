import { BookRepository } from "@/backend/db/repo/book.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { BookReturnType } from "@/backend/types/book.types";
import { AppPermission } from "@/shared/lib/enum";

export namespace BookService {
  export async function listBooks(actorUserId: string, locale?: string): Promise<BookReturnType[]> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_LIST);
    if (!hasPermission) {
      throw new Error(t("unauthorizedAction"));
    }

    return await BookRepository.findMany();
  }

  export async function deleteBook(bookId: string, actorUserId: string, locale?: string): Promise<boolean> {
    try {
      const t = await getBackendTranslations({ locale, namespace: "errors" });

      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_DELETE);
      if (!hasPermission) {
        throw new Error(t("unauthorizedAction"));
      }

      const book = await BookRepository.findById(bookId);
      if (!book) {
        throw new Error(t("bookNotFound"));
      }

      await BookRepository.deleteBook(bookId, locale);

      logger.info("Book deleted", { bookId, actorUserId });
      return true;
    } catch (error) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      if (
        error instanceof Error &&
        (error.message === t("unauthorizedAction") || error.message === t("bookNotFound"))
      ) {
        throw error;
      }
      throw new Error(t("bookDeleteFailed"), { cause: error });
    }
  }
}

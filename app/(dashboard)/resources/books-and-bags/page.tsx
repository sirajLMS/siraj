import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { BookService } from "@/backend/services/resource/book.service";
import { AvailabilityStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { BooksAndBagsView } from "@/frontend/common/views/dashboard/resources/books-and-bags/booksAndBagsView";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

function mapAvailabilityStatus(status: string): AvailabilityStatus {
  if (status === "OUT_OF_STOCK") {
    return AvailabilityStatus.OutOfStock;
  }
  return AvailabilityStatus.Available;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.booksAndBags;
  return { title: t.pageTitle };
}

export default async function BooksAndBagsPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return undefined;
  }
  await requirePermissionForPage(userId, [AppPermission.RESOURCES_LIST], locale, context);

  const books = await BookService.listBooks(userId, locale);

  return (
    <BooksAndBagsView
      initialBooks={books.map(book => ({
        id: book.id,
        name: book.name,
        availabilityStatus: mapAvailabilityStatus(book.availabilityStatus),
      }))}
    />
  );
}

import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { BookService } from "@/backend/services";
import { AvailabilityStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
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

export default withPageAuth([AppPermission.RESOURCES_LIST], async ({ userId, locale }) => {
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
});

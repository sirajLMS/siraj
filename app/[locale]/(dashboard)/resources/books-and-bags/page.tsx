import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { BookService } from "@/backend/services/resource/book.service";
import { AvailabilityStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { BooksAndBagsClient } from "@/frontend/views/dashboard/resources/books-and-bags/BooksAndBagsClient";
import type { BooksAndBagsPageProps } from "@/frontend/views/dashboard/resources/books-and-bags/booksAndBags.types";
import { redirect } from "@/shared/i18n/routing";

function mapAvailabilityStatus(status: string): AvailabilityStatus {
  if (status === "OUT_OF_STOCK") {
    return AvailabilityStatus.OutOfStock;
  }
  return AvailabilityStatus.Available;
}

export default async function BooksAndBagsPage({ params }: BooksAndBagsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();

  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  const books = await BookService.listBooks(userId, locale);

  return (
    <BooksAndBagsClient
      initialBooks={books.map(book => ({
        id: book.id,
        name: book.name,
        availabilityStatus: mapAvailabilityStatus(book.availabilityStatus),
      }))}
    />
  );
}

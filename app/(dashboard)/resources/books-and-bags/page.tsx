import type { Metadata } from "next";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { BookService } from "@/backend/services/resource/book.service";
import { AvailabilityStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import type { BooksAndBagsPageProps } from "@/frontend/common/views/dashboard/resources/books-and-bags/booksAndBags.types";
import { BooksAndBagsView } from "@/frontend/common/views/dashboard/resources/books-and-bags/booksAndBagsView";
import { getTranslations } from "@/shared/locale";

function mapAvailabilityStatus(status: string): AvailabilityStatus {
  if (status === "OUT_OF_STOCK") {
    return AvailabilityStatus.OutOfStock;
  }
  return AvailabilityStatus.Available;
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.booksAndBags;
  return { title: t.pageTitle };
}

export default async function BooksAndBagsPage({ params }: BooksAndBagsPageProps) {
  const { locale } = await params;

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin();
    return;
  }

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

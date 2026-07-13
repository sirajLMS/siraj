"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { BooksAndBagsGrid } from "@/frontend/common/views/dashboard/resources/books-and-bags/BooksAndBagsGrid";
import type {
  BookItem,
  BooksAndBagsClientProps,
  BooksAndBagsLabels,
} from "@/frontend/common/views/dashboard/resources/books-and-bags/booksAndBags.types";

export function BooksAndBagsClient({ initialBooks }: Readonly<BooksAndBagsClientProps>) {
  const t = useTranslations("dashboard.booksAndBags");

  const labels: BooksAndBagsLabels = useMemo(
    () => ({
      pageTitle: t("pageTitle"),
      pageSubtitle: t("pageSubtitle"),
      noEntries: t("noEntries"),
      statusAvailable: t("statusAvailable"),
      statusOutOfStock: t("statusOutOfStock"),
      deleteSuccess: t("deleteSuccess"),
      deleteFailed: t("deleteFailed"),
    }),
    [t]
  );

  const [books, setBooks] = useState<BookItem[]>(() =>
    initialBooks.map(book => ({
      id: book.id,
      name: book.name,
      availabilityStatus: book.availabilityStatus,
    }))
  );

  const handleDelete = (bookId: string) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
  };

  return (
    <RequirePermission permissions={[AppPermission.ResourcesList]}>
      <PageContainer>
        <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
        <BooksAndBagsGrid books={books} labels={labels} onDelete={handleDelete} />
      </PageContainer>
    </RequirePermission>
  );
}

"use client";

import { useMemo, useState } from "react";
import type {
  BookItem,
  BooksAndBagsClientProps,
  BooksAndBagsLabels,
} from "@/frontend/common/views/dashboard/resources/books-and-bags/booksAndBags.types";
import { useAppTranslation } from "@/shared/locale";

export type UseBooksAndBagsViewModelProps = BooksAndBagsClientProps;

export interface BooksAndBagsViewModel {
  readonly labels: BooksAndBagsLabels;
  readonly books: readonly BookItem[];
  readonly onDelete: (bookId: string) => void;
}

export function useBooksAndBagsViewModel(props: Readonly<UseBooksAndBagsViewModelProps>): BooksAndBagsViewModel {
  const t = useAppTranslation();
  const tBooks = t.dashboardTranslations.booksAndBags;

  const labels = useMemo<BooksAndBagsLabels>(
    () => ({
      pageTitle: tBooks.pageTitle,
      pageSubtitle: tBooks.pageSubtitle,
      noEntries: tBooks.noEntries,
      statusAvailable: tBooks.statusAvailable,
      statusOutOfStock: tBooks.statusOutOfStock,
      deleteSuccess: tBooks.deleteSuccess,
      deleteFailed: tBooks.deleteFailed,
    }),
    [tBooks]
  );

  const [books, setBooks] = useState<BookItem[]>(() =>
    props.initialBooks.map(book => ({
      id: book.id,
      name: book.name,
      availabilityStatus: book.availabilityStatus,
    }))
  );

  const handleDelete = (bookId: string) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
  };

  return {
    labels,
    books,
    onDelete: handleDelete,
  };
}

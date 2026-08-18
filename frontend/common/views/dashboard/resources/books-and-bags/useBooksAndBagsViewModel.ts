"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo, useState } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { deleteBookMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  BookItem,
  BooksAndBagsClientProps,
  BooksAndBagsLabels,
} from "@/frontend/common/views/dashboard/resources/books-and-bags/booksAndBags.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export type UseBooksAndBagsViewModelProps = BooksAndBagsClientProps;

export interface BooksAndBagsViewModel {
  readonly labels: BooksAndBagsLabels;
  readonly books: readonly BookItem[];
  // NEW FOR PLAN v5: lifted permission boolean per specs.md §3 N3 + §6.1.
  // Tier books-and-bags pages no longer import `RequirePermission` — the
  // Container wraps the View in `<RequirePermission>` and the tier view
  // renders content unconditionally.
  readonly canResourcesList: boolean;
  readonly canResourcesDelete: boolean;
  // NEW FOR PLAN v5: lifted the `useMutation(deleteBookMutationDocument)` +
  // `useNotifications()` previously inline in `bookItemCard.{m,d}.tsx` per
  // specs.md §3 N1 + N17 + §6.2 — the ViewModel is the SOLE owner of mutations
  // and toast side-effects. The tier component now receives a plain callback.
  readonly onDelete: (bookId: string) => Promise<void>;
}

export function useBooksAndBagsViewModel(props: Readonly<UseBooksAndBagsViewModelProps>): BooksAndBagsViewModel {
  const tBooks = useAppTranslation(Translation.Dashboard.BooksAndBags);

  // NEW FOR PLAN v5: read the user's permissions ONCE in the ViewModel.
  const hasPermission = useUserStore(state => state.hasPermission);
  const canResourcesList = hasPermission(AppPermission.ResourcesList);
  const canResourcesDelete = hasPermission(AppPermission.ResourcesDelete);

  // NEW FOR PLAN v5: toast side-effects live in the ViewModel per specs.md §3 N17 + §6.2.
  const notifications = useNotifications();

  const labels = useMemo<BooksAndBagsLabels>(
    () => ({
      pageTitle: tBooks.pageTitle,
      pageSubtitle: tBooks.pageSubtitle,
      noEntries: tBooks.noEntries,
      statusAvailable: tBooks.statusAvailable,
      statusOutOfStock: tBooks.statusOutOfStock,
      deleteSuccess: tBooks.deleteSuccess,
      deleteFailed: tBooks.deleteFailed,
      ariaDeleteBook: tBooks.ariaDeleteBook,
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

  // NEW FOR PLAN v5: GraphQL mutation owned by the ViewModel per specs.md §3 N1 + §6.2.
  const [deleteBook] = useMutation(deleteBookMutationDocument);

  const onDelete = async (bookId: string): Promise<void> => {
    try {
      await deleteBook({ variables: { id: bookId } });
      setBooks(prev => prev.filter(b => b.id !== bookId));
      notifications.show(labels.deleteSuccess, { severity: "success", autoHideDuration: 4000 });
    } catch (err) {
      logger.error("Failed to delete book:", err);
      notifications.show(labels.deleteFailed, { severity: "error", autoHideDuration: 4000 });
    }
  };

  return {
    labels,
    books,
    canResourcesList,
    canResourcesDelete,
    onDelete,
  };
}

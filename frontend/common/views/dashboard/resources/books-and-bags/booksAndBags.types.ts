import type { AvailabilityStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface BookItem {
  readonly id: string;
  readonly name: string;
  readonly availabilityStatus: AvailabilityStatus;
}

export interface BooksAndBagsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly noEntries: string;
  readonly statusAvailable: string;
  readonly statusOutOfStock: string;
  readonly deleteSuccess: string;
  readonly deleteFailed: string;
}

export interface BooksAndBagsClientProps {
  readonly initialBooks: ReadonlyArray<{ id: string; name: string; availabilityStatus: AvailabilityStatus }>;
}

export interface BookItemCardProps {
  readonly book: BookItem;
  readonly labels: BooksAndBagsLabels;
  // NEW FOR PLAN v5: lifted the inline `useMutation(deleteBook...)` +
  // `useNotifications()` from `bookItemCard.{m,d}.tsx` to the ViewModel per
  // specs.md §3 N1 + N17 + §6.2. The callback now returns a Promise so the
  // tier component can `void` it; the ViewModel handles GraphQL + toasts.
  readonly onDelete: (bookId: string) => Promise<void>;
}

export interface BooksAndBagsGridProps {
  readonly books: readonly BookItem[];
  readonly labels: BooksAndBagsLabels;
  readonly onDelete: (bookId: string) => Promise<void>;
}

export interface BooksAndBagsPageProps {
  readonly params: Promise<{ locale: string }>;
}

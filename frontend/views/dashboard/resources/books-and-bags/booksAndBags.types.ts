import type { AvailabilityStatus } from "@/frontend/graphql/generated/gql/graphql-types";

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
  readonly onDelete: (bookId: string) => void;
}

export interface BooksAndBagsGridProps {
  readonly books: BookItem[];
  readonly labels: BooksAndBagsLabels;
  readonly onDelete: (bookId: string) => void;
}

export interface BooksAndBagsPageProps {
  readonly params: Promise<{ locale: string }>;
}

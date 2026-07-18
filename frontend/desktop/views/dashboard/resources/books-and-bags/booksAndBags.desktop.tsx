"use client";

import type { BooksAndBagsViewModel } from "@/frontend/common/views/dashboard/resources/books-and-bags/useBooksAndBagsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { BooksAndBagsGridDesktop } from "@/frontend/desktop/views/dashboard/resources/books-and-bags/components/booksAndBagsGrid.desktop";

export function BooksAndBagsDesktopView({ labels, books, onDelete }: Readonly<BooksAndBagsViewModel>) {
  // NEW FOR PLAN v5: the `<RequirePermission permissions={[AppPermission.ResourcesList]}>`
  // wrapper that previously lived here was lifted to `booksAndBagsView.tsx`
  // (the switcher) per specs.md §3 N3 + §6.1. The tier view now renders
  // content unconditionally.
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      <BooksAndBagsGridDesktop books={books} labels={labels} onDelete={onDelete} />
    </DesktopPageContainer>
  );
}

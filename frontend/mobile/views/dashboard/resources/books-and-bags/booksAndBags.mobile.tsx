"use client";

import type { BooksAndBagsViewModel } from "@/frontend/common/views/dashboard/resources/books-and-bags/useBooksAndBagsViewModel";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { BooksAndBagsGridMobile } from "@/frontend/mobile/views/dashboard/resources/books-and-bags/components/booksAndBagsGrid.mobile";

export function BooksAndBagsMobileView({ labels, books, onDelete }: Readonly<BooksAndBagsViewModel>) {
  // NEW FOR PLAN v5: the `<RequirePermission permissions={[AppPermission.ResourcesList]}>`
  // wrapper that previously lived here was lifted to `booksAndBagsView.tsx`
  // (the switcher) per specs.md §3 N3 + §6.1. The tier view now renders
  // content unconditionally.
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />
      <MobileContentStack gap={3} paddingBottom={4}>
        <BooksAndBagsGridMobile books={books} labels={labels} onDelete={onDelete} />
      </MobileContentStack>
    </MobilePageContainer>
  );
}

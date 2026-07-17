"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { BooksAndBagsViewModel } from "@/frontend/common/views/dashboard/resources/books-and-bags/useBooksAndBagsViewModel";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { BooksAndBagsGridMobile } from "@/frontend/mobile/views/dashboard/resources/books-and-bags/components/booksAndBagsGrid.mobile";

export function BooksAndBagsMobileView({ labels, books, onDelete }: Readonly<BooksAndBagsViewModel>) {
  return (
    <RequirePermission permissions={[AppPermission.ResourcesList]}>
      <MobilePageContainer>
        <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />
        <MobileContentStack gap={3} paddingBottom={4}>
          <BooksAndBagsGridMobile books={books} labels={labels} onDelete={onDelete} />
        </MobileContentStack>
      </MobilePageContainer>
    </RequirePermission>
  );
}

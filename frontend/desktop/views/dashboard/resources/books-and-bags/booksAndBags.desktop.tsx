"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { BooksAndBagsViewModel } from "@/frontend/common/views/dashboard/resources/books-and-bags/useBooksAndBagsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { BooksAndBagsGridDesktop } from "@/frontend/desktop/views/dashboard/resources/books-and-bags/components/booksAndBagsGrid.desktop";

export function BooksAndBagsDesktopView({ labels, books, onDelete }: Readonly<BooksAndBagsViewModel>) {
  return (
    <RequirePermission permissions={[AppPermission.ResourcesList]}>
      <DesktopPageContainer>
        <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
        <BooksAndBagsGridDesktop books={books} labels={labels} onDelete={onDelete} />
      </DesktopPageContainer>
    </RequirePermission>
  );
}

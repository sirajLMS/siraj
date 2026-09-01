"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type BooksAndBagsViewModel,
  type UseBooksAndBagsViewModelProps,
  useBooksAndBagsViewModel,
} from "@/frontend/common/views/dashboard/resources/books-and-bags/useBooksAndBagsViewModel";

// NEW FOR PLAN v5: the `<RequirePermission permissions={[AppPermission.ResourcesList]}>`
// wrapper that previously lived in the books-and-bags tier view files was
// lifted here per specs.md §3 N3 + §6.1 — permission gating lives in the
// common Container/Switcher. The tier files now render content unconditionally.

const lazyViews = createLazyView<BooksAndBagsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/resources/books-and-bags/booksAndBags.mobile").then(m => ({
      default: m.BooksAndBagsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/resources/books-and-bags/booksAndBags.desktop").then(m => ({
      default: m.BooksAndBagsDesktopView,
    }))
);

export function BooksAndBagsView(props: Readonly<UseBooksAndBagsViewModelProps>) {
  const viewModel = useBooksAndBagsViewModel(props);
  return (
    <RequirePermission permissions={[AppPermission.ResourcesList]} fallback={null}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

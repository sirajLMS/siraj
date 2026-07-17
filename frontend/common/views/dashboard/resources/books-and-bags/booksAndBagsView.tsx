"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type BooksAndBagsViewModel,
  type UseBooksAndBagsViewModelProps,
  useBooksAndBagsViewModel,
} from "@/frontend/common/views/dashboard/resources/books-and-bags/useBooksAndBagsViewModel";

export type { BooksAndBagsViewModel };

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
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

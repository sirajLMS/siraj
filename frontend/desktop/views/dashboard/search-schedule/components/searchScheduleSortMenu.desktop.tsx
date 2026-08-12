"use client";

import { SearchScheduleSortMenuShared } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleSortMenuShared";
import type { SearchScheduleSortMenuProps } from "@/frontend/common/views/dashboard/search-schedule/types";

export function SearchScheduleSortMenuDesktop(props: Readonly<SearchScheduleSortMenuProps>) {
  return <SearchScheduleSortMenuShared {...props} />;
}

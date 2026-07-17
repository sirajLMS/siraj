"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  TeacherDirectoryMetrics,
  TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface TeachersViewProps {
  readonly metrics: TeacherDirectoryMetrics | null | undefined;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly totalTeachers: number;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
}

const lazyViews = createLazyView<TeachersViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/home/teachersView.mobile").then(m => ({
      default: m.TeachersMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/home/teachersView.desktop").then(m => ({
      default: m.TeachersDesktopView,
    }))
);

/**
 * Switcher for the Teachers directory view. Lazily loads the matching tier's
 * view (`teachersView.mobile.tsx` / `teachersView.desktop.tsx`) via
 * `ResponsiveViewSwitch`. Receives the full flat `TeachersViewProps` from
 * `TeachersContainer.tsx` and forwards the same prop bag to both tier views;
 * each tier destructures only the props it consumes (mobile ignores
 * `totalTeachers`; desktop ignores `searchQuery` / `onSearchChange`).
 */
export function TeachersView(props: Readonly<TeachersViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { CategoryItem, SubjectItem } from "@/frontend/common/views/dashboard/subjects/home/types";

export interface SubjectDialogsViewProps {
  readonly categories: readonly CategoryItem[];
  readonly selectedSubject: SubjectItem | null;
  readonly selectedCategory: CategoryItem | null;
  readonly pendingDeleteSubject: SubjectItem | null;
  readonly pendingDeleteCategory: CategoryItem | null;
  readonly refetchSubjects: () => Promise<unknown>;
  readonly activeCategoryId: string | null;
  readonly onCategoryReset: () => void;
}

const lazyDialogs = createLazyView<SubjectDialogsViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/subjects/home/components/subjectDialogs.mobile").then(m => ({
      default: m.SubjectDialogsMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/subjects/home/components/subjectDialogs.desktop").then(m => ({
      default: m.SubjectDialogsDesktop,
    }))
);

/**
 * SubjectDialogsView — common-layer switcher for the per-tier dialog
 * orchestrators. Wraps the lazy-loaded mobile/desktop `SubjectDialogs*`
 * components (which internally consume `useSubjectManagementStore` and
 * `useSubjectMutations`) so the data-fetching Container stays viewport-neutral.
 */
export function SubjectDialogsView(props: Readonly<SubjectDialogsViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyDialogs.mobile} desktop={lazyDialogs.desktop} props={props} />;
}

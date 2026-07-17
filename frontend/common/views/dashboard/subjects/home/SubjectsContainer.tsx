"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type SubjectsViewModel,
  useSubjectsViewModel,
} from "@/frontend/common/views/dashboard/subjects/home/useSubjectsViewModel";

const lazyViews = createLazyView<SubjectsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/subjects/home/subjectsView.mobile").then(m => ({
      default: m.SubjectsViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/subjects/home/subjectsView.desktop").then(m => ({
      default: m.SubjectsViewDesktop,
    }))
);

export function SubjectsContainer() {
  const viewModel = useSubjectsViewModel({});

  return (
    <RequirePermission permissions={[AppPermission.SubjectsList]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type {
  SubjectsViewModel,
  UseSubjectsViewModelProps,
} from "@/frontend/common/views/dashboard/subjects/home/useSubjectsViewModel";

export const SUBJECT_PERMS = [AppPermission.SubjectsCreate, AppPermission.SubjectsUpdate, AppPermission.SubjectsDelete];
export const CATEGORY_PERMS = [
  AppPermission.CategoriesCreate,
  AppPermission.CategoriesUpdate,
  AppPermission.CategoriesDelete,
];

export function buildActionHandlers(
  canManage: boolean,
  openCreate: () => void,
  openEdit: (id: string) => void,
  openDelete: (id: string) => void
) {
  return canManage
    ? { onAdd: openCreate, onEdit: openEdit, onDelete: openDelete }
    : { onAdd: () => {}, onEdit: () => {}, onDelete: () => {} };
}

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";

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

"use client";

import type { SubjectsViewProps } from "@/frontend/common/views/dashboard/subjects/home/types";

export interface SubjectDialogsSharedProps
  extends Pick<
    SubjectsViewProps,
    | "createSubjectDialog"
    | "editSubjectDialog"
    | "deleteSubjectDialog"
    | "createCategoryDialog"
    | "editCategoryDialog"
    | "deleteCategoryDialog"
  > {
  readonly CreateSubjectDialog: React.ComponentType<Readonly<SubjectsViewProps["createSubjectDialog"]>>;
  readonly EditSubjectDialog: React.ComponentType<Readonly<SubjectsViewProps["editSubjectDialog"]>>;
  readonly DeleteSubjectDialog: React.ComponentType<Readonly<SubjectsViewProps["deleteSubjectDialog"]>>;
  readonly CreateCategoryDialog: React.ComponentType<Readonly<SubjectsViewProps["createCategoryDialog"]>>;
  readonly EditCategoryDialog: React.ComponentType<Readonly<SubjectsViewProps["editCategoryDialog"]>>;
  readonly DeleteCategoryDialog: React.ComponentType<Readonly<SubjectsViewProps["deleteCategoryDialog"]>>;
}

/**
 * Renders all six subject/category dialog components as spread-prop siblings.
 *
 * Both desktop and mobile `SubjectsView` variants duplicate this exact block
 * — the only difference is *which* tier component is passed in.
 */
export function SubjectDialogsShared({
  createSubjectDialog,
  editSubjectDialog,
  deleteSubjectDialog,
  createCategoryDialog,
  editCategoryDialog,
  deleteCategoryDialog,
  CreateSubjectDialog,
  EditSubjectDialog,
  DeleteSubjectDialog,
  CreateCategoryDialog,
  EditCategoryDialog,
  DeleteCategoryDialog,
}: Readonly<SubjectDialogsSharedProps>) {
  return (
    <>
      <CreateSubjectDialog {...createSubjectDialog} />
      <EditSubjectDialog {...editSubjectDialog} />
      <DeleteSubjectDialog {...deleteSubjectDialog} />
      <CreateCategoryDialog {...createCategoryDialog} />
      <EditCategoryDialog {...editCategoryDialog} />
      <DeleteCategoryDialog {...deleteCategoryDialog} />
    </>
  );
}

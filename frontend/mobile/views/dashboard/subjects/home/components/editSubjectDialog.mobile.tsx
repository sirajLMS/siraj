"use client";

import {
  makeEditSubjectDialog,
  makeMobileSubjectTier,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectDialogWrappers";

/** EditSubjectDialogMobile — full-screen edit-subject dialog. */
export const EditSubjectDialogMobile = makeEditSubjectDialog({
  ...makeMobileSubjectTier(),
  formId: "edit-subject-form-mobile",
  titleId: "edit-subject-dialog-title-mobile",
});

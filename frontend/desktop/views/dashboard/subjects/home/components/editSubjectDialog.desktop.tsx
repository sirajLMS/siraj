"use client";

import {
  makeDesktopSubjectTier,
  makeEditSubjectDialog,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectDialogWrappers";

/** EditSubjectDialogDesktop — `sm`-width centered edit-subject dialog. */
export const EditSubjectDialogDesktop = makeEditSubjectDialog({
  ...makeDesktopSubjectTier(),
  formId: "edit-subject-form-desktop",
  titleId: "edit-subject-dialog-title-desktop",
});

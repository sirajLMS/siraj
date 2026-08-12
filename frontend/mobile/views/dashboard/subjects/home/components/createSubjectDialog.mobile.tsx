"use client";

import {
  makeCreateSubjectDialog,
  makeMobileSubjectTier,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectDialogWrappers";

/** CreateSubjectDialogMobile — full-screen create-subject dialog. */
export const CreateSubjectDialogMobile = makeCreateSubjectDialog(makeMobileSubjectTier());

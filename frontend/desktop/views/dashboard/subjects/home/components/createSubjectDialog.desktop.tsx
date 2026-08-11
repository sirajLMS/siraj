"use client";

import {
  makeCreateSubjectDialog,
  makeDesktopSubjectTier,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectDialogWrappers";

/** CreateSubjectDialogDesktop — `sm`-width centered create-subject dialog. */
export const CreateSubjectDialogDesktop = makeCreateSubjectDialog(makeDesktopSubjectTier());

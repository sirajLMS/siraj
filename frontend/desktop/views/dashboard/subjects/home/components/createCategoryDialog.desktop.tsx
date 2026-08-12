"use client";

import {
  makeCreateCategoryDialog,
  makeDesktopCategoryTier,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/categoryDialogWrappers";

/** CreateCategoryDialogDesktop — `sm`-width centered create-category dialog. */
export const CreateCategoryDialogDesktop = makeCreateCategoryDialog(makeDesktopCategoryTier());

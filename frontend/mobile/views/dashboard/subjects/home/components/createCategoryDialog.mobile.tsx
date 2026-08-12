"use client";

import {
  makeCreateCategoryDialog,
  makeMobileCategoryTier,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/categoryDialogWrappers";

/** CreateCategoryDialogMobile — full-screen create-category dialog. */
export const CreateCategoryDialogMobile = makeCreateCategoryDialog(makeMobileCategoryTier());

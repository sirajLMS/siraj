"use client";

import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui/button/ActionButtons";
import { BaseDeleteDialogScaffold } from "@/frontend/common/components/ui/dialog/baseDeleteDialogShared";
import type { BaseDeleteDialogSharedProps as BaseDeleteDialogProps } from "@/frontend/common/components/ui/dialog/types/baseDeleteDialogShared.types";

export type { BaseDeleteDialogProps };

export function BaseDeleteDialog(props: Readonly<BaseDeleteDialogProps>) {
  return (
    <BaseDeleteDialogScaffold {...props} CancelActionButton={FilterButton} ConfirmActionButton={PrimaryPageAction} />
  );
}

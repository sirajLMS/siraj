"use client";

import { BaseDeleteDialogScaffold } from "@/frontend/common/components/ui/dialog/baseDeleteDialogShared";
import type { BaseDeleteDialogSharedProps as DesktopBaseDeleteDialogProps } from "@/frontend/common/components/ui/dialog/types/baseDeleteDialogShared.types";
import { DesktopFilterButton, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";

export type { DesktopBaseDeleteDialogProps };

export function DesktopBaseDeleteDialog(props: Readonly<DesktopBaseDeleteDialogProps>) {
  return (
    <BaseDeleteDialogScaffold
      {...props}
      CancelActionButton={DesktopFilterButton}
      ConfirmActionButton={DesktopPrimaryPageAction}
    />
  );
}

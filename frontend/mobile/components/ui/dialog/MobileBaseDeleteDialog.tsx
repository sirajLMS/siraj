"use client";

import { BaseDeleteDialogScaffold } from "@/frontend/common/components/ui/dialog/baseDeleteDialogShared";
import type { BaseDeleteDialogSharedProps as MobileBaseDeleteDialogProps } from "@/frontend/common/components/ui/dialog/types/baseDeleteDialogShared.types";
import { MobileFilterButton, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";

export type { MobileBaseDeleteDialogProps };

export function MobileBaseDeleteDialog(props: Readonly<MobileBaseDeleteDialogProps>) {
  return (
    <BaseDeleteDialogScaffold
      {...props}
      CancelActionButton={MobileFilterButton}
      ConfirmActionButton={MobilePrimaryPageAction}
    />
  );
}

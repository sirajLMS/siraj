"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { ComplaintQueueCardShared } from "@/frontend/common/views/dashboard/complaints/components/complaintQueueCardShared";
import type { AdminComplaintRow } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import {
  MobileCardListItem,
  MobileFilterButton,
  MobilePrimaryPageAction,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import type { ComplaintsAdminLabels } from "@/shared/locale";

interface ComplaintQueueCardMobileProps {
  readonly row: AdminComplaintRow;
  readonly labels: ComplaintsAdminLabels;
  readonly draftResponse: string;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly onDraftChange: (text: string) => void;
  readonly onAnswer: (options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: () => void;
}

function MobileRoot({ children, isUnanswered }: Readonly<{ children: ReactNode; isUnanswered: boolean }>) {
  return (
    <MobileCardListItem
      variant="rounded"
      accentBorder={isUnanswered ? { color: "warning", side: "inline-start" } : undefined}
    >
      {children}
    </MobileCardListItem>
  );
}

const mobileEmailActionSx: SxProps<Theme> = theme => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  borderColor: theme.palette.primary.main,
  "&:hover": { backgroundColor: theme.palette.primary.dark },
});

const mobileDeleteActionSx: SxProps<Theme> = theme => ({
  color: theme.palette.error.main,
  borderColor: theme.palette.error.main,
  "&:hover": { backgroundColor: theme.palette.errorContainer },
});

export function ComplaintQueueCardMobile({
  row,
  labels,
  draftResponse,
  canManage,
  canDelete,
  onDraftChange,
  onAnswer,
  onDelete,
}: Readonly<ComplaintQueueCardMobileProps>) {
  return (
    <ComplaintQueueCardShared
      row={row}
      labels={labels}
      draftResponse={draftResponse}
      canManage={canManage}
      canDelete={canDelete}
      onDraftChange={onDraftChange}
      onAnswer={onAnswer}
      onDelete={onDelete}
      slots={{
        Root: MobileRoot,
        StatusBadge: MobileStatusBadge,
        PrimaryActionButton: MobilePrimaryPageAction,
        EmailActionButton: MobileFilterButton,
        DeleteActionButton: MobileFilterButton,
        EmailActionSx: mobileEmailActionSx,
        DeleteActionSx: mobileDeleteActionSx,
        HeaderDirection: "column",
        HeaderJustifyContent: "flex-start",
        HeaderAlignItems: "flex-start",
        SubmitterGap: 1.5,
        AvatarSize: 40,
        StatusTextAlign: "left",
        ReceivedTimeMarginTop: 0.5,
        ActionsDirection: "column",
        ActionsJustifyContent: "flex-end",
      }}
    />
  );
}

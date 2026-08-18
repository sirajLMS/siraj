"use client";

import { Paper } from "@mui/material";
import { type SxProps, styled, type Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { ComplaintQueueCardShared } from "@/frontend/common/views/dashboard/complaints/components/complaintQueueCardShared";
import type { AdminComplaintRow } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { DesktopFilterButton, DesktopPrimaryPageAction, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import type { ComplaintsAdminLabels } from "@/shared/locale";

interface ComplaintQueueCardDesktopProps {
  readonly row: AdminComplaintRow;
  readonly labels: ComplaintsAdminLabels;
  readonly draftResponse: string;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly onDraftChange: (text: string) => void;
  readonly onAnswer: (options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: () => void;
}

const StyledQueueCardPaper = styled(Paper, {
  shouldForwardProp: prop => prop !== "isUnanswered",
})<{ isUnanswered: boolean }>(({ theme, isUnanswered }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: isUnanswered ? theme.palette.surface : theme.palette.surfaceContainerLow,
  transition: theme.transitions.create("background-color", { duration: 150, easing: "ease" }),
}));

function DesktopRoot({ children, isUnanswered }: Readonly<{ children: ReactNode; isUnanswered: boolean }>) {
  return (
    <StyledQueueCardPaper elevation={0} isUnanswered={isUnanswered}>
      {children}
    </StyledQueueCardPaper>
  );
}

const desktopEmailActionSx: SxProps<Theme> = theme => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  borderColor: theme.palette.primary.main,
  "&:hover": { backgroundColor: theme.palette.primary.dark },
});

export function ComplaintQueueCardDesktop({
  row,
  labels,
  draftResponse,
  canManage,
  canDelete,
  onDraftChange,
  onAnswer,
  onDelete,
}: Readonly<ComplaintQueueCardDesktopProps>) {
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
        Root: DesktopRoot,
        StatusBadge: DesktopStatusBadge,
        PrimaryActionButton: DesktopPrimaryPageAction,
        EmailActionButton: DesktopFilterButton,
        DeleteActionButton: DesktopFilterButton,
        EmailActionSx: desktopEmailActionSx,
        DeleteActionSx: undefined,
        HeaderDirection: "row",
        HeaderJustifyContent: "space-between",
        HeaderAlignItems: "flex-start",
        SubmitterGap: 2,
        AvatarSize: 48,
        StatusTextAlign: "right",
        ReceivedTimeMarginTop: 1,
        ActionsDirection: "row",
        ActionsJustifyContent: "flex-end",
      }}
    />
  );
}

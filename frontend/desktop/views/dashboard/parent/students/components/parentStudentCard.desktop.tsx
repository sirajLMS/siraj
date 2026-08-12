"use client";

import type { ReactNode } from "react";
import { BaseCard } from "@/frontend/common/components/ui";
import {
  ParentStudentCardShared,
  type ParentStudentCardSharedOptions,
} from "@/frontend/common/views/dashboard/parent/students/components/__shared__/parentStudentCardShared";
import { DESKTOP_BASE_OPTIONS } from "@/frontend/common/views/dashboard/parent/students/components/__shared__/parentStudentCardShared.options";
import type { ParentStudentCardLabels } from "@/frontend/common/views/dashboard/parent/students/types/parentStudentCard.types";
import type { ParentStudentRow } from "@/frontend/common/views/dashboard/parent/students/useParentStudentsViewModel";
import { DesktopPersonProfileLink, DesktopStatusBadge } from "@/frontend/desktop/components/ui";

export interface ParentStudentDesktopCardProps {
  readonly row: ParentStudentRow;
  readonly labels: ParentStudentCardLabels;
}

const DESKTOP_OPTIONS: ParentStudentCardSharedOptions = {
  ...DESKTOP_BASE_OPTIONS,
  renderContainer: (children, row) => (
    <BaseCard
      sx={theme => ({
        opacity: row.isDeactivated ? 0.72 : 1,
        borderInlineStart: row.isDeactivated ? `4px solid ${theme.palette.error.main}` : undefined,
      })}
    >
      {children}
    </BaseCard>
  ),
  renderProfileLink: (row, href) => (
    <DesktopPersonProfileLink
      href={href}
      name={row.name}
      avatarUrl={row.studentAvatarUrl}
      fallbackInitial="S"
      avatarSize={48}
      typographyVariant="titleLg"
      fontWeight={700}
    />
  ),
  renderStatusBadge: (row, labels) => (
    <DesktopStatusBadge
      category="studentAccount"
      status={row.accountStatus}
      label={labels.statusLabels[row.accountStatus]}
    />
  ),
};

export function ParentStudentDesktopCard({ row, labels }: Readonly<ParentStudentDesktopCardProps>): ReactNode {
  return <ParentStudentCardShared row={row} labels={labels} options={DESKTOP_OPTIONS} />;
}

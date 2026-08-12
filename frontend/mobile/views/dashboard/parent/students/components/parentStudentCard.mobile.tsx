"use client";

import type { ReactNode } from "react";
import {
  ParentStudentCardShared,
  type ParentStudentCardSharedOptions,
} from "@/frontend/common/views/dashboard/parent/students/components/__shared__/parentStudentCardShared";
import { MOBILE_BASE_OPTIONS } from "@/frontend/common/views/dashboard/parent/students/components/__shared__/parentStudentCardShared.options";
import type { ParentStudentCardLabels } from "@/frontend/common/views/dashboard/parent/students/types/parentStudentCard.types";
import type { ParentStudentRow } from "@/frontend/common/views/dashboard/parent/students/useParentStudentsViewModel";
import { MobileCardListItem, MobilePersonProfileLink, MobileStatusBadge } from "@/frontend/mobile/components/ui";

export interface ParentStudentMobileCardProps {
  readonly row: ParentStudentRow;
  readonly labels: ParentStudentCardLabels;
}

const MOBILE_OPTIONS: ParentStudentCardSharedOptions = {
  ...MOBILE_BASE_OPTIONS,
  renderContainer: (children, row) => (
    <MobileCardListItem
      variant="edge-to-edge"
      dimmed={row.isDeactivated}
      accentBorder={row.isDeactivated ? { color: "error", side: "inline-start" } : undefined}
    >
      {children}
    </MobileCardListItem>
  ),
  renderProfileLink: (row, href) => (
    <MobilePersonProfileLink
      href={href}
      name={row.name}
      avatarUrl={row.studentAvatarUrl}
      fallbackInitial="S"
      avatarSize={48}
      typographyVariant="bodyLg"
      fontWeight={700}
    />
  ),
  renderStatusBadge: (row, labels) => (
    <MobileStatusBadge
      category="studentAccount"
      status={row.accountStatus}
      label={labels.statusLabels[row.accountStatus]}
    />
  ),
};

export function ParentStudentMobileCard({ row, labels }: Readonly<ParentStudentMobileCardProps>): ReactNode {
  return <ParentStudentCardShared row={row} labels={labels} options={MOBILE_OPTIONS} />;
}
